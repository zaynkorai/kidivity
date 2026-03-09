import { GenerateBody } from '../schemas/activity.schema.js';

// ── Constraint context builder ───────────────────────────
function buildConstraintContext(input: GenerateBody): string {
    const timeMap = { '5min': '5 minutes', '20min': '20 minutes', '1hr+': 'over an hour' };
    const energyMap = {
        exhausted: 'The parent is exhausted — the activity MUST be fully independent with zero supervision, zero prep, and zero cleanup.',
        moderate: 'The parent has moderate energy — minimal setup is acceptable; parent can assist briefly.',
        high: 'The parent has high energy — active bonding, hands-on participation, and longer setup are all fine.',
    };
    const envMap = {
        indoor: 'The setting is indoors (living room, bedroom). Use only common household items.',
        kitchen: 'The setting is the kitchen. Kitchen scraps, boxes, Tupperware, and pantry items are available.',
        'on-the-go': 'The activity must work on the go (car, restaurant, waiting room). No messy materials, no large items.',
    };
    const formatMap = {
        printable: 'Format as a printable worksheet — structured layout with a fun header/greeting, followed by the illustration, and a 1-sentence kid-friendly instruction.',
        'parent-led': 'Format as a printable worksheet.',
        'screen-free-play': 'Format as a printable worksheet.',
    };

    return `
PARENT CONSTRAINTS (MUST follow strictly):
- Time available: ${timeMap[input.time_available]}
- Energy context: ${energyMap[input.energy_level]}
- Environment: ${envMap[input.environment]}
- Output format: ${formatMap[input.format]}
`;
}

// ── System instruction ───────────────────────────────────
export function buildSystemInstruction(profile: any): string {
    return `You are Kidivity, an AI that creates fun, engaging activities for children.
You always respond with well-structured, age-appropriate content.
Format your response in clean markdown.

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Grade: ${profile.grade_level}
- Interests: ${(profile.interests || []).join(', ')}`;
}

// ── Prompt builders ─────────────────────────────────────
export function buildPromptUser(profile: any, input: GenerateBody): string {
    const constraints = buildConstraintContext(input);
    const style = input.style === 'bw' ? 'Black and white, optimized for printing' : 'Colorful and visually engaging';

    let categoryPrompt = '';
    switch (input.category) {
        case 'logic':
            categoryPrompt = `Create a short intro for a ${input.difficulty} visual logic puzzle about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include a fun greeting and a 1-sentence instruction on how to solve the puzzle.`;
            break;
        case 'tracing':
            categoryPrompt = `Create a short intro for a ${input.difficulty} tracing activity about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include a fun greeting and a 1-sentence instruction on what to trace.`;
            break;
        case 'educational':
            categoryPrompt = `Create a short intro for a ${input.difficulty} visual educational activity about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include a fun greeting and 1-2 amazing facts about the topic.`;
            break;
        case 'screen-free':
            categoryPrompt = `Create a short intro for a ${input.difficulty} screen-free coloring/drawing activity about "${input.topic}" for a ${profile.age}-year-old (${profile.grade_level}). Include a fun greeting and a 1-sentence instruction on what to do.`;
            break;
        default:
            categoryPrompt = `Create a fun, short greeting for an activity about "${input.topic}".`;
    }

    return `CRITICAL: You MUST write ONLY 2-3 sentences max. Do NOT write a full lesson. Do NOT use long lists. Keep it extremely brief and kid-friendly.\n\nStyle: ${style}\nDifficulty: ${input.difficulty}\n\n${constraints}\n\n${categoryPrompt}`;
}

export function buildImagePrompt(profile: any, input: GenerateBody): string {
    const topInterests = (profile.interests || []).slice(0, 3).join(', ');
    const isTracing = input.category === 'tracing';
    const isLogic = input.category === 'logic';
    const isEdu = input.category === 'educational';

    let layoutInstruction = "1. LAYOUT: Create a SINGLE, LARGE, DETAILED scene filling the entire canvas. Do NOT draw a border or frame. Do NOT draw a piece of paper.";
    if (isLogic) {
            layoutInstruction = "1. LAYOUT: Create a visual logic puzzle (like a maze, spot the difference, matching, or visual grid). Ensure it is clear and solvable visually. Do NOT draw a border around the image.";
    } else if (isEdu) {
            layoutInstruction = "1. LAYOUT: Create a highly detailed, educational illustration or diagram related to the topic. Do NOT draw a border around the image.";
    }

    const tracingInstruction = isTracing
        ? `1. LAYOUT: Create a SINGLE, LARGE, DETAILED scene filling the TOP 70% of the canvas. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white) so that text can be added later. Do NOT draw a piece of paper.
5. If Tracing: we DO NOT need you to draw letters. Just provide an illustration related to the topic.`
        : "";

    // Phase 8: Age-Tailored Visuals in Image Prompt
    const ageInstruction = `Age/Grade target: ${profile.age}-year-old (${profile.grade_level}). Adjust visual complexity appropriately. For younger kids, use large, simple, chunky shapes. For older kids, use more intricate, detailed art.`;

    const imagePrompt = `Generate high-contrast, clean black and white line art optimized for A4 paper printing for a children's ${input.category} activity about "${input.topic}".
Activity Type: ${input.category}

STYLE ENFORCEMENT: All illustrations MUST be strictly black outlined with WHITE fills (coloring book style). Do NOT use solid blacks or grays for objects.
IMPORTANT THEME ENFORCEMENT: The illustrations, characters, and decorative elements MUST be based on the theme: "${topInterests || input.topic}".

Specific Instructions:
${layoutInstruction}
2. Visualize the items mentioned in the content exactly.
3. ${ageInstruction}
${tracingInstruction}
6. Keep lines simple, bold, and distinct.
7. **FINAL CHECK**: Ensure the background is PURE WHITE (#FFFFFF) with NO texture or grey tint.
Constraints: No shading or gradients to ensure maximum clarity on printing. ABSOLUTELY NO CURSIVE SCRIPT. If generating letters, they MUST be standard block letters and correctly spelled. DO NOT add any stylistic flourishes to letters that make them hard to read for a child.`;

    return imagePrompt;
}
