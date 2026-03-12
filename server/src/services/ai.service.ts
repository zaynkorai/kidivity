import { GoogleGenAI, Modality, Type, Schema } from '@google/genai';
import type { FastifyBaseLogger } from 'fastify';
import { uploadBase64Image } from '../lib/r2.js';

interface GenerateActivityParams {
    geminiKey: string;
    sysInstruction: string;
    promptText: string;
    buildImagePrompt?: (dynamicPrompt: string) => string;
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
    imagePrompt: string;
};

// Define the schema for text responses exactly as requested
const activityResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Plain title text (no Markdown)." },
    instructions: { type: Type.STRING, description: "Markdown (no H1). Must start with a single > Parent Note line, then ## Instructions." },
    content: { type: Type.STRING, description: "Markdown sections (no H1). Print-friendly formatting only." },
    imagePrompt: { type: Type.STRING, description: "Plain text only (no Markdown). Describe exactly what the illustration should show; mention concrete objects/counts/characters. No text/letters/numbers in the image." },
  },
  required: ["title", "instructions", "content", "imagePrompt"],
};

function stripCodeFences(text: string): string {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    return cleanText;
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

    const title = typeof parsed?.title === 'string' ? parsed.title.trim() : '';
    const instructions = typeof parsed?.instructions === 'string' ? parsed.instructions.trim() : '';
    const content = typeof parsed?.content === 'string' ? parsed.content.trim() : '';
    const imagePrompt = typeof parsed?.imagePrompt === 'string' ? parsed.imagePrompt.trim() : '';

    if (!title || !instructions || !content || !imagePrompt) {
        logger.error({ parsed }, 'Gemini returned JSON missing required fields');
        throw new Error('AI returned an incomplete response. Please try again.');
    }

    return {
        title,
        instructions: stripH1(instructions),
        content: stripH1(content),
        imagePrompt,
    };
}

export async function generateActivityContent({
    geminiKey,
    sysInstruction,
    promptText,
    model,
    buildImagePrompt,
    isVisualCategory,
    logger
}: GenerateActivityParams): Promise<GenerateResult> {
    
    // Create an instance leveraging the provided API key
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // 1. Generate Text First
    let markdown = '';
    let dynamicImagePrompt = '';
    
    let activity: ActivityResponse | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const retrySuffix =
                attempt === 1
                    ? ''
                    : '\n\nIMPORTANT: Return ONLY valid JSON matching the schema. Do not include Markdown code fences or any extra text.';
            const res = await ai.models.generateContent({
                model: model,
                contents: `${promptText}${retrySuffix}`,
                config: {
                    systemInstruction: sysInstruction,
                    responseMimeType: "application/json",
                    responseSchema: activityResponseSchema,
                    temperature: 0.4,
                },
            });

            const text = res.text;
            if (!text) throw new Error("No text returned from Gemini");

            activity = parseActivityResponse(logger, text);
            break;
        } catch (err: any) {
            logger.error({ err, attempt }, 'Gemini text attempt failed');
            if (attempt === maxAttempts) {
                throw new Error(err.message || 'Unknown error generating activity');
            }
        }
    }

    if (!activity) {
        throw new Error('AI returned an unexpected format. Please try again.');
    }

    markdown = `# ${activity.title}\n\n${activity.instructions}\n\n${activity.content}`;
    dynamicImagePrompt = activity.imagePrompt;

    // 2. Generate Image (Sequential)
    let image_url: string | null = null;

    if (isVisualCategory && buildImagePrompt && dynamicImagePrompt) {
        try {
            const finalImagePrompt = buildImagePrompt(dynamicImagePrompt);
            const promptPreview = finalImagePrompt.slice(0, 400);

            // Prefer Gemini multimodal generation first.
            try {
                const res = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: finalImagePrompt,
                    config: { responseModalities: [Modality.IMAGE] },
                });

                const parts = res.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                    if (part.inlineData?.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        image_url = `data:${mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }

                if (!image_url) {
                    const textParts = parts
                        .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
                        .filter(Boolean)
                        .join('\n')
                        .slice(0, 400);
                    logger.warn(
                        { promptPreview, textPartsPreview: textParts },
                        'Image model returned no inline image data'
                    );
                }
            } catch (err: any) {
                logger.error({ err, promptPreview }, 'Gemini image generation failed');
            }

            // Fallback to Imagen if Gemini returns no inline image.
            if (!image_url) {
                const img = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: finalImagePrompt,
                    config: { numberOfImages: 1 },
                });

                const first = img.generatedImages?.[0];
                const bytes = first?.image?.imageBytes;
                if (bytes) {
                    const mimeType = first?.image?.mimeType || 'image/png';
                    image_url = `data:${mimeType};base64,${bytes}`;
                } else {
                    logger.warn(
                        { promptPreview, raiFilteredReason: first?.raiFilteredReason },
                        'Imagen returned no image bytes'
                    );
                }
            }
        } catch (err: any) {
            logger.error(err, 'Error calling image generation API');
            // We don't throw here to still return the content even if image fails
        }
        
        // 3. Upload to Cloudflare R2 if we successfully generated an image
        if (image_url) {
            try {
                const r2Url = await uploadBase64Image(image_url, logger);
                if (r2Url) {
                    image_url = r2Url; // Overwrite the base64 string with the public URL
                }
            } catch (r2Err: any) {
                logger.error({ err: r2Err }, 'Failed to upload image to R2');
            }
        }
    }

    return { content: markdown, image_url };
}
