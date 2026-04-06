import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { FastifyBaseLogger } from 'fastify';
import { uploadBase64Image } from '../lib/r2.js';
import type { ImageSpec } from '../types/image-spec.js';

interface GenerateActivityParams {
    geminiKey: string;
    sysInstruction: string;
    promptText: string;
    buildImagePrompt?: (spec: ImageSpec) => string;
    model: string;
    isVisualCategory: boolean;
    logger: FastifyBaseLogger;
}

interface GenerateResult {
    content: string;
    image_url: string | null;
}

type ActivityResponse = {
    title: string;
    instructions: string;
    content: string;
    imageSpec: ImageSpec;
};

// ── Gemini response schema ────────────────────────────────────────────────────
// imageSpec is a STRUCTURED object — Gemini fills in WHAT to show.
// buildImagePrompt() owns HOW it is described to Imagen.
// No free-form prose from Gemini reaches Imagen.
const subjectItemSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        noun:       { type: Type.STRING, description: 'Concrete singular noun. e.g. "apple", "butterfly", "star".' },
        count:      { type: Type.INTEGER, description: 'Quantity that appears. Integer 1–20.' },
        descriptor: { type: Type.STRING, description: 'Optional visual quality: color, size, state. e.g. "red", "open", "large".' },
    },
    required: ['noun', 'count'],
};

const imageSpecSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        scene_type: {
            type: Type.STRING,
            enum: [
                // Math
                'math_counting', 'math_addition', 'math_subtraction', 'math_comparison',
                // Reading
                'character_story', 'reading_comic',
                // Science
                'science_lifecycle', 'science_anatomy', 'science_comparison', 'science_diagram',
                // Puzzles
                'puzzle_maze', 'puzzle_matching', 'puzzle_pattern',
                'puzzle_odd_one_out', 'puzzle_sorting', 'puzzle_spot_differences',
                // Art
                'art_coloring', 'art_drawing_steps', 'art_craft_template',
                // Tracing
                'tracing_character', 'tracing_scene',
            ],
            description: 'The specific visual grammar. Pick the most precise value: e.g. "science_lifecycle" for a lifecycle, "math_addition" for adding two groups.',
        },
        layout: {
            type: Type.STRING,
            enum: [
                'centered_single', 'row_layout', 'grid_layout',
                'two_group_layout', 'ring_layout', 'two_column_table',
                'two_panel_identical', 'scene_with_bg', 'diagram',
                'multi_panel', 'top_scene_blank_bottom',
            ],
            description: 'Spatial arrangement. Match to scene_type: lifecycle→ring_layout, addition→two_group_layout, comic→multi_panel.',
        },
        topic_type: {
            type: Type.STRING,
            enum: ['animal', 'plant', 'object', 'person', 'place', 'process', 'concept'],
            description: 'Nature of the topic. "concept" = abstract (weather, emotions, seasons). "process" = sequence of actions (cooking, water cycle). This helps the compiler give Imagen the right rendering instruction.',
        },
        subjects: {
            type: Type.ARRAY,
            description: 'Primary visual subjects. At least one required. Concrete, countable nouns only.',
            items: subjectItemSchema,
        },
        group_a: {
            type: Type.ARRAY,
            description: 'MATH ADDITION/SUBTRACTION/COMPARISON ONLY — subjects in the first group. Empty array otherwise.',
            items: subjectItemSchema,
        },
        group_b: {
            type: Type.ARRAY,
            description: 'MATH ADDITION/SUBTRACTION/COMPARISON ONLY — subjects in the second group (or being removed for subtraction). Empty array otherwise.',
            items: subjectItemSchema,
        },
        background: {
            type: Type.STRING,
            description: 'Environment in ≤5 concrete words. Use "plain white" when no background is needed.',
        },
        action: {
            type: Type.STRING,
            description: 'Most important spatial/sequential relationship. Lifecycle: "egg → caterpillar → chrysalis → butterfly, clockwise". Addition: "three apples plus two oranges equals five". Empty string if none.',
        },
        tracing_target: {
            type: Type.STRING,
            description: 'TRACING ONLY — exact target: "uppercase A", "digit 5", "wavy line". Empty string for all other categories.',
        },
        tracing_has_path: {
            type: Type.BOOLEAN,
            description: 'TRACING ONLY — true = overlay a single-stroke dashed guide path. false otherwise.',
        },
        diagram_part_count: {
            type: Type.INTEGER,
            description: 'SCIENCE LIFECYCLE/ANATOMY/DIAGRAM ONLY — number of distinct stages or parts. e.g. 4 for butterfly lifecycle, 5 for water cycle. 0 otherwise.',
        },
        panel_count: {
            type: Type.INTEGER,
            description: 'ART DRAWING STEPS or READING COMIC ONLY — number of panels: 2, 3, or 4. 0 for all other scene types.',
        },
        color_palette: {
            type: Type.STRING,
            enum: ['warm', 'cool', 'natural', 'pastel', 'vibrant', 'neutral'],
            description: 'Topic-appropriate palette. warm=autumn/food/warmth, cool=ocean/space/winter, natural=forest/animals/garden, pastel=baby animals/gentle stories, vibrant=math/puzzles/energetic art, neutral=when color is irrelevant.',
        },
    },
    required: [
        'scene_type', 'layout', 'topic_type', 'subjects', 'group_a', 'group_b',
        'background', 'action', 'tracing_target', 'tracing_has_path',
        'diagram_part_count', 'panel_count', 'color_palette',
    ],
};


const activityResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title:        { type: Type.STRING, description: 'Plain title text (no Markdown).' },
        instructions: { type: Type.STRING, description: 'Markdown (no H1). Must start with a single > Parent Note line, then ## Instructions.' },
        content:      { type: Type.STRING, description: 'Markdown sections (no H1). Print-friendly formatting only.' },
        imageSpec:    imageSpecSchema,
    },
    required: ['title', 'instructions', 'content', 'imageSpec'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripCodeFences(text: string): string {
    let t = text.trim();
    if (t.startsWith('```')) {
        t = t.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    return t;
}

function stripH1(markdown: string): string {
    return markdown
        .split('\n')
        .filter((line) => !/^#\s+/.test(line))
        .join('\n')
        .trim();
}

function parseActivityResponse(logger: FastifyBaseLogger, text: string): ActivityResponse {
    const cleanText = stripCodeFences(text);
    let parsed: any;
    try {
        parsed = JSON.parse(cleanText);
    } catch (parseErr) {
        logger.error({ err: parseErr, cleanText }, 'Gemini returned invalid JSON');
        throw new Error('AI returned an unexpected format. Please try again.');
    }

    const title        = typeof parsed?.title        === 'string' ? parsed.title.trim()        : '';
    const instructions = typeof parsed?.instructions === 'string' ? parsed.instructions.trim() : '';
    const content      = typeof parsed?.content      === 'string' ? parsed.content.trim()      : '';
    const imageSpec    = parsed?.imageSpec;

    // Validate the imageSpec structural contract at runtime
    if (!title || !instructions || !content || !imageSpec) {
        logger.error({ parsed }, 'Gemini response missing required fields');
        throw new Error('AI returned an incomplete response. Please try again.');
    }
    if (!Array.isArray(imageSpec.subjects) || imageSpec.subjects.length === 0) {
        logger.error({ imageSpec }, 'imageSpec.subjects missing or empty');
        throw new Error('AI returned an invalid image spec. Please try again.');
    }

    return {
        title,
        instructions: stripH1(instructions),
        content:      stripH1(content),
        imageSpec:    imageSpec as ImageSpec,
    };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateActivityContent({
    geminiKey,
    sysInstruction,
    promptText,
    model,
    buildImagePrompt,
    isVisualCategory,
    logger,
}: GenerateActivityParams): Promise<GenerateResult> {

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // 1. Generate structured activity (text + typed image spec)
    let activity: ActivityResponse | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const retrySuffix = attempt === 1
                ? ''
                : '\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No code fences.';

            const res = await ai.models.generateContent({
                model,
                contents: `${promptText}${retrySuffix}`,
                config: {
                    systemInstruction: sysInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: activityResponseSchema,
                    temperature: 0.4,
                },
            });

            const text = res.text;
            if (!text) throw new Error('No text returned from Gemini');
            activity = parseActivityResponse(logger, text);
            break;
        } catch (err: any) {
            logger.error({ err, attempt }, 'Gemini text attempt failed');
            if (attempt === maxAttempts) {
                throw new Error(err.message || 'Unknown error generating activity');
            }
        }
    }

    if (!activity) throw new Error('AI returned an unexpected format. Please try again.');

    const markdown = `# ${activity.title}\n\n${activity.instructions}\n\n${activity.content}`;

    // 2. Compile the Imagen prompt deterministically from the typed spec.
    //    No free-form text from Gemini reaches Imagen.
    let image_url: string | null = null;

    if (isVisualCategory && buildImagePrompt) {
        const finalImagePrompt = buildImagePrompt(activity.imageSpec);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-image-preview',
                contents: finalImagePrompt,
            });

            const parts = response.candidates?.[0]?.content?.parts || [];
            
            for (const part of parts) {
                if (part.inlineData) {
                    const imageData = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    image_url = `data:${mimeType};base64,${imageData}`;
                    break;
                }
            }

            if (!image_url) {
                logger.warn(
                    { promptPreview: finalImagePrompt.slice(0, 300) },
                    'Image model returned no inlineData parts'
                );
            }
        } catch (err: any) {
            logger.error({ err, promptPreview: finalImagePrompt.slice(0, 300) }, 'Image generation failed');
        }

        // 3. Upload to R2 if image was generated
        if (image_url) {
            try {
                const r2Url = await uploadBase64Image(image_url, logger);
                if (r2Url) image_url = r2Url;
            } catch (r2Err: any) {
                logger.error({ err: r2Err }, 'Failed to upload image to R2');
            }
        }
    }

    return { content: markdown, image_url };
}
