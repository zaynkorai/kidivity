import { GenerateBody } from '../schemas/activity.schema.js';
import type { ImageSpec, VisualSubject } from '../types/image-spec.js';

// ── System instruction ────────────────────────────────────────────────────────
export function buildSystemInstruction(profile: any, feedback?: string[]): string {
    const feedbackSection = feedback && feedback.length > 0
        ? `\n\nUSER FEEDBACK & PREFERENCES (PERSONALIZATION):\n${feedback.map(f => `- ${f}`).join('\n')}\nFollow these preferences strictly to improve quality for this specific child.`
        : '';

    return `You are Kidivity, an expert pedagogical AI specializing in creating high-quality, printable activities for children.

OUTPUT FORMAT (STRICT):
- Return a single JSON object matching the provided schema. No extra keys. No surrounding text. No code fences.
- Use Markdown ONLY inside the "instructions" and "content" string fields.
- Do NOT include an H1 title inside "instructions" or "content".

QUALITY / ACCURACY:
- No conversational filler. No emojis.
- Scientifically accurate and age/grade appropriate.
- If unsure about a fact, keep it general or omit it — do not guess.
- Print-first and screen-free (no links, QR codes, apps, "watch a video" steps).
- Materials must be safe and common for home use.

IMAGE SPEC ("imageSpec" field) — CRITICAL RULES:
- Fill in the structured imageSpec object. Do NOT write prose descriptions.
- "subjects" must only contain concrete, visualizable nouns (no abstract concepts).
- "count" must be a whole number from 1–10. AI models cannot reliably count above 10.
- "background" must be ≤5 concrete words. Use "plain white" when no environment is needed.
- "action" describes only spatial relationships, sequences, or physical actions — not feelings or ideas.
- "topic_type": classify the topic's nature — animal/plant/object/person/place/process/concept.
  Use "concept" only for truly abstract topics (weather, emotions, seasons, time).
  Use "process" for sequential actions (cooking, water cycle, seed sprouting).
- "color_palette": choose based on topic and mood, not category.
- "group_a" / "group_b": ONLY for math_addition, math_subtraction, math_comparison. Empty arrays otherwise.
- "tracing_target" / "tracing_has_path": ONLY for tracing activities.
- "diagram_part_count": ONLY for science lifecycle/anatomy/diagram. 0 otherwise.
- "panel_count": ONLY for art_drawing_steps or reading_comic. 0 otherwise.

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Grade: ${profile.grade_level}${feedbackSection}`;
}

// ── User prompt ───────────────────────────────────────────────────────────────
export function buildPromptUser(profile: any, input: GenerateBody): string {
    const style = input.style === 'bw'
        ? 'Black and white, optimized for home printing (Ink-saver)'
        : 'Colorful and visually engaging';

    let categoryPrompt = '';
    switch (input.category) {

        case 'math': {
            const maxObjects = 10; // AI generation is unreliable for counting > 10
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} math activity about "${input.topic}".
Target: ${profile.age}-year-old (${profile.grade_level}).
FOCUS: Counting, addition, subtraction, or comparison. Every question must be solvable by counting visible objects.
NON-OVERLAP: No abstract patterns, no mazes, no symbolic-only equations.

imageSpec guidance — choose the MOST SPECIFIC scene_type:
- "math_counting" → single group of objects to count (layout: row_layout or grid_layout)
- "math_addition" → two distinct groups being combined (layout: two_group_layout, fill group_a AND group_b)
- "math_subtraction" → objects being removed from a group (layout: two_group_layout, group_a = full set, group_b = subset being removed)
- "math_comparison" → two groups compared by quantity (layout: two_group_layout, fill group_a AND group_b)
Total objects across all groups must not exceed ${maxObjects}.
action: describe the grouping precisely, e.g. "three red apples on the left, two yellow bananas on the right".
color_palette: "vibrant" for colorful math; "neutral" for bw.
topic_type: classify the topic (animal/plant/object/person/place/process/concept).

CONTENT REQUIREMENTS:
- title: "Math Fun: ..." (plain text).
- instructions: > **Parent Note:** what skill this builds. Then ## Instructions.
- content: ## The Math Challenge (3-4 word problems or counting exercises). End with --- then **Answer Key:**.`;
            break;
        }

        case 'science': {
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} educational fact sheet and quiz about "${input.topic}".
Target: ${profile.age}-year-old (${profile.grade_level}).
PEDAGOGICAL CONSTRAINT: Objective facts only. No fictional narrative.

imageSpec guidance — choose the MOST SPECIFIC scene_type:
- "science_lifecycle" → circular life stages (layout: ring_layout, diagram_part_count = number of stages)
- "science_anatomy" → labeled body parts or cross-section (layout: centered_single or diagram, diagram_part_count = number of parts)
- "science_comparison" → two subjects compared side-by-side (layout: two_column_table, subjects = both subjects, one each)
- "science_diagram" → general educational illustration (layout: diagram or centered_single)
action: for lifecycle, write the full sequence e.g. "egg → larva → pupa → adult, clockwise".
For anatomy, list the parts e.g. "roots at bottom, stem center, leaves top, flower apex".
color_palette: "natural" for biology; "cool" for space/water; "warm" for earth science.
topic_type: classify the topic (animal/plant/object/person/place/process/concept).

CONTENT REQUIREMENTS:
- title: "Discovering ..." (plain text).
- instructions: > **Parent Note:** how to use the page. Then ## Instructions (2-4 steps).
- content: ## The Big Idea, ## Did You Know? (3-5 facts), ## Mini Quiz (3 questions), > **Parent Tip:** (1 discussion question).`;
            break;
        }

        case 'puzzles': {
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} logic puzzle about "${input.topic}".
Pedagogical Focus: ${profile.age}-year-old (${profile.grade_level}) — pattern recognition, sequencing, matching, or simple deduction.
NON-OVERLAP: No arithmetic. Focus purely on spatial, visual, or logical rules.

imageSpec guidance — choose the MOST SPECIFIC scene_type:
- "puzzle_maze" → navigable path through obstacles (layout: centered_single)
- "puzzle_matching" → two columns, draw-a-line (layout: grid_layout)
- "puzzle_pattern" → sequence with one missing element (layout: row_layout)
- "puzzle_odd_one_out" → one item differs from a set (layout: row_layout)
- "puzzle_sorting" → groups to sort by a visible rule (layout: grid_layout)
- "puzzle_spot_differences" → two nearly identical images (layout: two_panel_identical, subjects = items that differ)
action: describe the puzzle relationship exactly, e.g. "five stars in a row, fourth position is empty".
color_palette: "vibrant" for colorful; "neutral" for bw.
topic_type: classify the topic.

CONTENT REQUIREMENTS:
- title: A fun theme title (plain text, no #).
- instructions: > **Parent Note:** briefly explain the logic rule. Then ## Instructions.
- content: ## The Challenge (full puzzle setup, solvable on paper). End with --- then **Answer Key:**.`;
            break;
        }

        case 'art': {
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} art activity about "${input.topic}".
Target: ${profile.age}-year-old (${profile.grade_level}). Time: 15-30 minutes.
FOCUS: Choose the most appropriate art type for "${input.topic}".

imageSpec guidance — choose the MOST SPECIFIC scene_type:
- "art_drawing_steps" → how-to-draw sequence (layout: multi_panel, panel_count = 2, 3, or 4)
- "art_coloring" → single scene coloring page (layout: centered_single or scene_with_bg)
- "art_craft_template" → flat craft shape to cut/fold (layout: centered_single)
color_palette: match the topic mood — "warm" for autumn/fire, "cool" for ocean/sky, "natural" for animals/garden, "pastel" for baby themes, "vibrant" for bold fun art.
topic_type: classify the topic.

CONTENT REQUIREMENTS:
- title: "Art Time: ..." (plain text).
- instructions: > **Parent Note:** what the child practices. Then ## Instructions with numbered steps.
- content: ## Materials Needed (common household supplies only). Add ## Drawing Steps or ## Craft Steps as needed.`;
            break;
        }

        case 'reading': {
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} reading exercise or short story about "${input.topic}".
Target: ${profile.age}-year-old (${profile.grade_level}).
PEDAGOGICAL CONSTRAINT: Fictional tale or reading comprehension. Not a fact sheet.

imageSpec guidance — choose the MOST SPECIFIC scene_type:
- "reading_comic" → if the story has distinct sequential moments (layout: multi_panel, panel_count = 3)
- "character_story" → if the story has one central moment to capture (layout: scene_with_bg)
subjects: named characters and key props. For comic, list the character once — compiler handles repetition.
action: the single most important moment or emotion.
background: the story's setting in ≤5 concrete words.
color_palette: match the story's mood — "warm" for cozy/home stories, "cool" for adventure/ocean, "pastel" for gentle/friendship.
topic_type: classify the topic.

CONTENT REQUIREMENTS:
- title: "Story Time: ..." (plain text).
- instructions: > **Parent Note:** (read together vs independent). Then ## Instructions.
- content: ## The Tale (2-3 paragraphs). ## Think About It (2 comprehension questions).`;
            break;
        }

        case 'tracing': {
            const isCharacterTracing = /number|digit|alphabet|letter/i.test(input.topic);
            const taskFocus = isCharacterTracing
                ? 'character formation and tracing (large, clear, dotted-outline characters)'
                : 'pen-control and pre-writing practice (foundational warm-up)';

            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} ${taskFocus} activity about "${input.topic}".
Target: ${profile.age}-year-old (${profile.grade_level}).

imageSpec guidance:
- scene_type: "${isCharacterTracing ? 'tracing_character' : 'tracing_scene'}"
- layout: "top_scene_blank_bottom"
- tracing_target: "${isCharacterTracing ? 'the exact character or digit, e.g. "uppercase letter A" or "digit 5"' : '""'}"
- tracing_has_path: ${input.simpleTracingPaths ? 'true — a simple single-stroke dashed guide path should be overlaid on the scene' : 'false'}
- subjects: ${isCharacterTracing ? 'the character itself as the sole subject (count: 1)' : 'one concrete noun related to the topic for the scene (count: 1)'}
- color_palette: "pastel" for young children; "vibrant" for older.
- topic_type: classify the topic.

CONTENT REQUIREMENTS:
- title: "Let's Trace: ..." (plain text).
- instructions: > **Parent Note:** "${isCharacterTracing ? 'character formation practice' : 'pre-writing warm-up'}" with posture/grip tip. Then ## Instructions with 3-5 steps.
- content: ## Story Time (2 sentences describing the illustration). ## Target Words (3-5 concrete nouns related to "${input.topic}").`;
            break;
        }

        default:
            categoryPrompt = `Task: Create a professional-grade, fun, and engaging lesson about "${input.topic}".

imageSpec guidance:
- scene_type: "character_story", layout: "centered_single"
- subjects: the most relevant concrete object or character from the topic
- background: "plain white"
- topic_type: classify the topic
- color_palette: "vibrant"`;
    }

    return `Return ONLY a single JSON object matching the schema. Fields:
- "title": plain text only.
- "instructions": Markdown (no H1), starts with > **Parent Note:**.
- "content": Markdown sections (no H1), print-friendly.
- "imageSpec": structured object per schema — NOT a string. All required fields must be present.

CRITICAL QUALITY STANDARD: Every activity MUST feel like a premium workbook page.
Style: ${style}
Difficulty: ${input.difficulty}

${categoryPrompt}
`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function subjectPhrase(subjects: VisualSubject[]): string {
    return subjects
        .map(s => {
            const desc = s.descriptor ? `${s.descriptor} ` : '';
            return s.count === 1 ? `one ${desc}${s.noun}` : `${s.count} ${desc}${s.noun}s`;
        })
        .join(', ');
}

// Map color_palette enum → concrete color words Imagen understands
function paletteToColors(palette: ImageSpec['color_palette'], isColor: boolean): string {
    if (!isColor) return ''; // ignored for bw
    const map: Record<ImageSpec['color_palette'], string> = {
        warm:    'golden yellow, soft orange, warm coral',
        cool:    'sky blue, aqua, soft lavender',
        natural: 'leafy green, bark brown, earth tan, sky blue',
        pastel:  'soft pink, baby blue, mint green, pale yellow',
        vibrant: 'bold red, bright yellow, vivid blue, fresh green',
        neutral: 'light grey, off-white',
    };
    return map[palette] ?? '';
}

// ── Deterministic Imagen prompt compiler ──────────────────────────────────────
// Owns ALL styling, layout, print constraints, and per-scene-type visual grammar.
// Every category × option × topic_type combination is an explicit branch.
export function buildImagePrompt(profile: any, input: GenerateBody, spec: ImageSpec): string {
    const isColor   = input.style === 'colorful';
    const isOutline = input.style === 'bw' && input.coloringBookMode;
    const mathMaxCount = 10; // Capped at 10 to ensure precise counting

    // ── 1. Style ──────────────────────────────────────────────────────────────
    const styleClause = isColor
        ? `flat vector illustration, children's book style, colors: ${paletteToColors(spec.color_palette, true)}`
        : isOutline
        ? 'premium coloring-page line art, crisp bold black outlines, thick strokes, large open white areas, no shading, no color fill'
        : 'clean black-and-white ink illustration, bold linework, no gray, no shading';

    // ── 2. Age complexity ─────────────────────────────────────────────────────
    const complexity = profile.age <= 6
        ? 'very simple rounded shapes, minimal detail, friendly and cute'
        : profile.age <= 9
        ? 'moderate detail, clear recognizable objects'
        : 'detailed but uncluttered, slightly realistic proportions';

    // ── 3. Topic-type rendering hint ──────────────────────────────────────────
    // Tells Imagen how to interpret the subject — prevents abstract hallucination
    const topicHint: Record<ImageSpec['topic_type'], string> = {
        animal:  'Render as a friendly, recognizable cartoon animal with clear species features.',
        plant:   'Render as a clearly identifiable plant with distinct leaves, stem, and/or flowers.',
        object:  'Render as a clean, solid real-world object with recognizable silhouette.',
        person:  'Render as a friendly cartoon child, culturally neutral, simple round face.',
        place:   'Render the environment with its most iconic elements (e.g. trees for forest, waves for ocean).',
        process: 'Show the physical objects involved in the process — not abstract arrows or symbols.',
        concept: 'Represent through the single most iconic concrete object associated with this concept. No abstract symbols, no text.',
    };
    const topicClause = topicHint[spec.topic_type] ?? '';

    // ── 4. Subject phrases ────────────────────────────────────────────────────
    const mainSubjects  = subjectPhrase(spec.subjects);
    const groupAPhrase  = spec.group_a && spec.group_a.length > 0 ? subjectPhrase(spec.group_a) : '';
    const groupBPhrase  = spec.group_b && spec.group_b.length > 0 ? subjectPhrase(spec.group_b) : '';

    // ── 5. Scene-type directive ───────────────────────────────────────────────
    let sceneDirective = '';

    switch (spec.scene_type) {

        // ── Math ──────────────────────────────────────────────────────────────
        case 'math_counting':
            sceneDirective = `Show ${mainSubjects}, maximum ${mathMaxCount} total. ${spec.action ? spec.action + '. ' : ''}Every object fully visible, no overlapping, individually countable. Plain white background.`;
            break;

        case 'math_addition':
            sceneDirective = `Two clearly separated groups. Left group: ${groupAPhrase || mainSubjects}. Right group: ${groupBPhrase}. ${spec.action ? spec.action + '. ' : ''}Wide gap between groups. Each object individually countable, no overlapping. Total objects max ${mathMaxCount}.`;
            break;

        case 'math_subtraction':
            sceneDirective = `Show ${groupAPhrase || mainSubjects} as the full set. The subset ${groupBPhrase} is visually marked as being removed (drawn with a dashed outline or X). ${spec.action ? spec.action + '. ' : ''}All objects individually visible and countable. Max ${mathMaxCount} total.`;
            break;

        case 'math_comparison':
            sceneDirective = `Two side-by-side groups with a clear vertical gap between them. Left group: ${groupAPhrase || mainSubjects}. Right group: ${groupBPhrase}. ${spec.action ? spec.action + '. ' : ''}Each object individually countable, no overlapping. Max ${mathMaxCount} total.`;
            break;

        // ── Reading ───────────────────────────────────────────────────────────
        case 'character_story':
            sceneDirective = `Children's book illustration. Show ${mainSubjects} in a ${spec.background || 'simple setting'}. ${spec.action ? spec.action + '. ' : ''}One clear central moment, expressive mood, uncluttered.`;
            break;

        case 'reading_comic': {
            const panels = Math.min(Math.max(spec.panel_count || 3, 2), 4);
            sceneDirective = `A ${panels}-panel comic strip arranged in a horizontal row. Each panel shows a different moment in the story with ${mainSubjects}. ${spec.action ? 'Story arc: ' + spec.action + '. ' : ''}Panels are clearly separated by thin lines. No text or speech bubbles inside panels.`;
            break;
        }

        // ── Science ───────────────────────────────────────────────────────────
        case 'science_lifecycle': {
            const stages = spec.diagram_part_count > 0 ? spec.diagram_part_count : 4;
            sceneDirective = `A circular lifecycle diagram with exactly ${stages} stages arranged clockwise: ${mainSubjects}. ${spec.action ? spec.action + '. ' : ''}Each stage clearly separated with generous whitespace. Arrows between stages shown as simple curved lines. No text or labels. Plain white background.`;
            break;
        }

        case 'science_anatomy':
            sceneDirective = `An educational anatomical illustration of ${mainSubjects}. ${spec.diagram_part_count > 0 ? `Show exactly ${spec.diagram_part_count} distinct labeled parts.` : ''} ${spec.action ? spec.action + '. ' : ''}Each component visually distinct with clear boundaries. No text labels. Diagram style, not a story scene.`;
            break;

        case 'science_comparison':
            sceneDirective = `A two-column comparison layout. Left column: ${groupAPhrase || mainSubjects}. Right column: ${groupBPhrase || 'the contrasting subject'}. A simple vertical dividing line between columns. ${spec.action ? spec.action + '. ' : ''}Each column shows ${spec.diagram_part_count > 0 ? spec.diagram_part_count : 3} key features. No text or labels.`;
            break;

        case 'science_diagram':
            sceneDirective = `Educational diagram of ${mainSubjects}. ${spec.diagram_part_count > 0 ? `Show ${spec.diagram_part_count} distinct parts.` : ''} ${spec.action ? spec.action + '. ' : ''}Each component visually distinct. No text or labels. Informational, not decorative.`;
            break;

        // ── Puzzles ───────────────────────────────────────────────────────────
        case 'puzzle_maze':
            sceneDirective = `A bold, simple decorative illustration of ${mainSubjects} to serve as background art for a maze game. ${spec.background && spec.background !== 'plain white' ? `Setting: ${spec.background}. ` : ''}Leave plenty of empty white space. Do NOT draw a maze, no walls, no paths.`;
            break;

        case 'puzzle_matching':
            sceneDirective = `A matching activity. Left column: ${mainSubjects}. Right column: their corresponding pairs in shuffled order. Wide empty white space between columns for drawing connection lines. Each item clearly spaced. No text.`;
            break;

        case 'puzzle_pattern':
            sceneDirective = `A pattern sequence of ${mainSubjects}. ${spec.action ? spec.action + '. ' : 'One position in the sequence is visually empty.'}Each item clearly distinct, generous even spacing in a row. No text.`;
            break;

        case 'puzzle_odd_one_out':
            sceneDirective = `A row of ${mainSubjects} where one item is clearly visually different from the others. ${spec.action ? spec.action + '. ' : ''}All items evenly spaced. No text.`;
            break;

        case 'puzzle_sorting':
            sceneDirective = `${mainSubjects} arranged to show a sorting activity. ${spec.action ? spec.action + '. ' : ''}Clear visual separation between categories. No text or labels.`;
            break;

        case 'puzzle_spot_differences':
            sceneDirective = `Two side-by-side panels showing nearly identical scenes with ${mainSubjects} in a ${spec.background || 'simple setting'}. The two panels have exactly ${(spec.subjects?.length ?? 3)} subtle visual differences between them. Each panel identical size, separated by a thin vertical line. No text.`;
            break;

        // ── Art ───────────────────────────────────────────────────────────────
        case 'art_coloring':
            sceneDirective = `Full coloring-page scene. Show ${mainSubjects}${spec.background && spec.background !== 'plain white' ? ` in a ${spec.background}` : ''}. Bold thick closed outlines on all shapes. Large open white interior areas for coloring. No shading, no fill, no gray.`;
            break;

        case 'art_drawing_steps': {
            const panels = Math.min(Math.max(spec.panel_count || 3, 2), 4);
            const grid = panels === 4 ? '2×2' : `1×${panels}`;
            sceneDirective = `A how-to-draw guide with ${panels} sequential panels in a ${grid} grid. Panel 1: one or two basic geometric shapes. Each subsequent panel adds more detail. Final panel: a complete, recognizable ${mainSubjects}. Panels clearly separated by thin lines. No text or numbers inside panels.`;
            break;
        }

        case 'art_craft_template':
            sceneDirective = `A flat craft template of ${mainSubjects}. Bold solid outer outline. Interior fold guides drawn as evenly-spaced dashed lines. No shading, no color fill. Pure white background.`;
            break;

        // ── Tracing ───────────────────────────────────────────────────────────
        case 'tracing_character':
            sceneDirective = `Draw only "${spec.tracing_target || 'the target character'}" as a single very large hollow character, centered in the upper 65% of the image. Character outline formed by large evenly-spaced dots. No solid fill. No other elements. Lower 35% of image is completely empty pure white.`;
            break;

        case 'tracing_scene':
            sceneDirective = `Simple friendly scene in the upper 65% showing ${mainSubjects}${spec.background && spec.background !== 'plain white' ? ` in a ${spec.background}` : ''}. ${spec.tracing_has_path ? 'Add exactly one simple dashed-line guide path related to the scene — single stroke only, no double lines.' : ''}Lower 35% is completely empty pure white for writing practice. One main subject, uncluttered.`;
            break;
    }

    // ── 6. Assemble ───────────────────────────────────────────────────────────
    const isTextAllowed = spec.scene_type === 'tracing_character';
    
    // Mimic the lost API `negativePrompt` parameter by explicitly appending an "AVOID" block
    const baseNegative = 'AVOID: watermarks, logos, signatures, borders, frames, shadows, dark backgrounds, gradients, realistic photos, 3d renders, clutter.';
    const textNegative = isTextAllowed
        ? `${baseNegative} Pure white background only.`
        : `${baseNegative} AVOID text, AVOID letters, AVOID numbers, AVOID words, AVOID labels. Pure white background only.`;

    return [
        `Children's educational ${input.category} activity. Topic: "${input.topic}".`,
        `Style: ${styleClause}.`,
        `Age: ${complexity}.`,
        topicClause,
        sceneDirective,
        textNegative,
    ]
        .filter(Boolean)
        .join(' ');
}
