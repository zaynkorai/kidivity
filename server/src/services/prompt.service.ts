import { GenerateBody } from '../schemas/activity.schema.js';

// ── System instruction ───────────────────────────────────
export function buildSystemInstruction(profile: any): string {
    return `You are Kaivity, an expert pedagogical AI specializing in creating high-quality, printable activities for children.

OUTPUT FORMAT (STRICT):
- Return a single JSON object that matches the provided JSON schema. No extra keys. No surrounding text. No code fences.
- Use Markdown ONLY inside the JSON string fields "instructions" and "content".
- Do NOT include an H1 title inside "instructions" or "content" (the app renders the H1 from the "title" field).

QUALITY / ACCURACY:
- No conversational filler (do not say "Here is your activity", "Enjoy", etc.).
- No emojis.
- Be scientifically accurate and age/grade appropriate.
- If you are not fully sure about a fact, do not guess; keep it general or omit the questionable detail.
- Keep everything print-first and screen-free (no links, QR codes, apps, or "watch a video" steps).
- Keep materials safe and common for home use. Avoid fire/heat, sharp tools, chemicals, or risky experiments.

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Grade: ${profile.grade_level}`;
}

// ── Prompt builders ─────────────────────────────────────
export function buildPromptUser(profile: any, input: GenerateBody): string {
    const style = input.style === 'bw' ? 'Black and white, optimized for home printing (Ink-saver)' : 'Colorful and visually engaging';

    let categoryPrompt = '';
    switch (input.category) {
        case 'puzzles':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} logic puzzle about "${input.topic}".
            Pedagogical Focus: Suitable for a ${profile.age}-year-old (${profile.grade_level}) focusing on pattern recognition, sequencing, matching, or simple deduction.
            
            NON-OVERLAP CONSTRAINT: Do NOT include arithmetic or counting questions; focus purely on spatial, visual, or logical rules.
            
            IMAGE PROMPT REQUIREMENTS:
            - The "imagePrompt" field MUST be a structured visual spec using this exact 6-line template:
              1) Puzzle Type: <maze | matching | sorting | pattern | odd-one-out | logic grid>
              2) Grid/Layout: <rows x cols or layout description; centered; generous whitespace>
              3) Required Objects: <object(count), object(count), ...> (concrete nouns only)
              4) Distractors: <object(count), ...> or "none"
              5) Answer/Path: <describe the correct solution placement or path in words>
              6) Composition Notes: <A4 portrait, 12mm margins, no borders, no text, pure white background>
            - Counts must be explicit numerals in the prompt, but NO numerals or letters should appear inside the image.
            
            CONTENT REQUIREMENTS (Markdown goes in "instructions" and "content" fields only):
            - title: A fun theme title (plain text, no #).
            - instructions: Start with > **Parent Note:** briefly explain the logic rule. Then add ## Instructions with step-by-step guidance for the child.
            - content: Add ## The Challenge with the full puzzle setup (solvable on paper). End with --- then **Answer Key:** with the solution.`;
            break;
            
        case 'tracing':
            const isCharacterTracing = /number|digit|alphabet|letter/i.test(input.topic);
            const taskFocus = isCharacterTracing 
                ? `character formation and tracing (large, clear, dotted-outline characters)`
                : `pen-control and pre-writing practice (foundational warm-up)`;

            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} ${taskFocus} activity about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            IMAGE PROMPT REQUIREMENTS:
            - The "imagePrompt" field MUST be a structured visual spec using this exact 6-line template:
              1) Trace Type: <${isCharacterTracing ? 'character | digit' : 'shape | path'}>
              2) Main Subject: <${isCharacterTracing ? 'single large character or digit' : 'single concrete noun scene'}>
              3) Trace Path: <describe the tracing path in words, single-stroke if simple>
              4) Blank Area: <bottom 30% empty, pure white>
              5) Line Style: <dotted or dashed, spacing noted, no double lines>
              6) Composition Notes: <A4 portrait, 12mm margins, no borders, no text, pure white background>
            - Counts may be explicit numerals in the prompt, but NO numerals or letters should appear inside the image EXCEPT for the tracing character itself.
            
            CONTENT REQUIREMENTS:
            - title: "Let's Trace: ..." (plain text).
            - instructions: Start with > **Parent Note:** Explain that this is a "${isCharacterTracing ? 'character formation practice' : 'foundational pre-writing warm-up'}" for pencil control (fine motor + posture/grip tip). Then ## Instructions with 3-5 simple steps for tracing the ${isCharacterTracing ? 'character' : 'path or outline'}.
            - content: Include ## Story Time with exactly 2 sentences describing the illustration. Include ## Target Words with a bulleted list of 3-5 CONCRETE NOUNS related to "${input.topic}" (single words, easy to visualize/talk about).`;
            break;
            
        case 'science':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} educational fact sheet and quiz about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            PEDAGOGICAL CONSTRAINT: Focus on objective facts and knowledge. Do NOT use a fictional narrative or character-driven story here (use the 'story' category for that).
            
            IMAGE PROMPT REQUIREMENTS:
            - The "imagePrompt" field MUST be a structured visual spec using this exact 6-line template:
              1) Diagram Type: <labeled diagram | lifecycle | comparison | simple scene>
              2) Required Objects: <object(count), object(count), ...> (concrete nouns only)
              3) Callout Points: <list of callout targets, no text>
              4) Sequence Steps: <if lifecycle or process, list steps in words>
              5) Visual Emphasis: <what should be central vs secondary>
              6) Composition Notes: <A4 portrait, 12mm margins, no borders, no text, pure white background>
            - Counts may be explicit numerals in the prompt, but NO numerals or letters should appear inside the image.
            
            CONTENT REQUIREMENTS:
            - title: "Discovering ..." (plain text).
            - instructions: Start with > **Parent Note:** (how to use the page). Then ## Instructions with 2-4 steps.
            - content: Include ## The Big Idea (short reading passage), ## Did You Know? (3-5 fun facts), ## Mini Quiz (3 questions: multiple choice or true/false), and finish with > **Parent Tip:** (one discussion question).`;
            break;
            
        case 'art':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} art and creation activity about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}). Time: 15-30 minutes.
            
            FOCUS: Depending on the topic, provide either step-by-step drawing instructions, a coloring page description, or craft instructions related to "${input.topic}".
            
            IMAGE PROMPT REQUIREMENTS:
            - The "imagePrompt" field MUST be a structured visual spec using this exact 6-line template:
              1) Art Type: <drawing-steps | coloring | craft-template>
              2) Subject: <main subject and theme>
              3) Panels/Regions: <panel grid or coloring regions description>
              4) Line Style: <thick outlines, closed shapes for coloring>
              5) Craft Lines: <if craft, describe cut or fold lines in words>
              6) Composition Notes: <A4 portrait, 12mm margins, no borders, no text, pure white background>
            - Counts may be explicit numerals in the prompt, but NO numerals or letters should appear inside the image.
            
            CONTENT REQUIREMENTS:
            - title: "Art Time: ..." (plain text).
            - instructions: Start with > **Parent Note:** what the child practices. Then ## Instructions with clear numbered steps.
            - content: Include ## Materials Needed (ONLY common household art supplies) and any additional sections needed (e.g., ## Drawing Steps, ## Craft Steps).`;
            break;
            
        case 'math':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} math and counting activity about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            FOCUS: Counting, simple addition, or number logic. 
            NON-OVERLAP CONSTRAINT: Do NOT use complex visual patterns or abstract mazes. Avoid number lines or symbolic-only equations. Each question must be solvable by counting visible objects in the image.
            
            IMAGE PROMPT REQUIREMENTS:
            - The "imagePrompt" field MUST be a structured visual spec using this exact 6-line template:
              1) Math Type: <counting | addition | subtraction | comparison>
              2) Required Objects: <object(count), object(count), ...> (concrete nouns only)
              3) Grouping/Layout: <rows x cols or grouping description; centered; generous whitespace>
              4) Problem Mapping: <describe how each question maps to object groups, in words>
              5) Answer Targets: <list targets in words, no numerals in the image>
              6) Composition Notes: <A4 portrait, 12mm margins, no borders, no text, pure white background>
            - Counts must be explicit numerals in the prompt, but NO numerals or letters should appear inside the image.
            
            CONTENT REQUIREMENTS:
            - title: "Math Fun: ..." (plain text).
            - instructions: Start with > **Parent Note:** what skill this builds. Then ## Instructions with a short how-to.
            - content: Include ## The Math Challenge with 3-4 simple word problems or counting exercises related to "${input.topic}". End with --- then **Answer Key:** with solutions.`;
            break;

        case 'reading':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} reading exercise or short story about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            PEDAGOGICAL CONSTRAINT: Focus on a fictional tale or reading comprehension.
            
            IMAGE PROMPT REQUIREMENTS:
            - The "imagePrompt" field MUST be a structured visual spec using this exact 6-line template:
              1) Scene: <what moment to depict>
              2) Characters: <list characters and counts>
              3) Props/Setting: <key objects and setting details>
              4) Action/Emotion: <central action or mood>
              5) Panel Layout: <single scene or multi-panel grid>
              6) Composition Notes: <A4 portrait, 12mm margins, no borders, no text, pure white background>
            - Counts may be explicit numerals in the prompt, but NO numerals or letters should appear inside the image.
            
            CONTENT REQUIREMENTS:
            - title: "Story Time: ..." (plain text).
            - instructions: Start with > **Parent Note:** (read together vs independent). Then ## Instructions (what to do after reading).
            - content: Include ## The Tale (2-3 paragraphs) and ## Think About It (2 comprehension questions).`;
            break;
            
        default:
            categoryPrompt = `Task: Create a professional-grade, fun, and engaging lesson about "${input.topic}" with clear Markdown headings in the "content" field.`;
    }

    return `Return ONLY a single JSON object with exactly these keys: "title", "instructions", "content", "imagePrompt".
Field rules:
- "title": plain text only (no Markdown, no quotes beyond JSON encoding).
- "instructions": Markdown (no H1). Must begin with a single line: > **Parent Note:** ...
- "content": Markdown sections (no H1). Use clear headings and print-friendly formatting.
- "imagePrompt": plain text ONLY (no Markdown). Describe exactly what the illustration should show. Mention concrete objects, quantities, and characters that appear in the activity. No text/letters/numbers in the image.

CRITICAL QUALITY STANDARD: Every activity MUST feel like a premium workbook page. Avoid generic, low-effort content.
Style: ${style}
Difficulty: ${input.difficulty}

${categoryPrompt}
`;
}

export function buildImagePrompt(profile: any, input: GenerateBody, dynamicPrompt: string): string {
    const isTracing = input.category === 'tracing';

    let layoutInstruction = "";
    const mathMaxCount = profile.age <= 7 ? 10 : 20;
    
    switch (input.category) {
        case 'puzzles':
            layoutInstruction = "1. LAYOUT: Create a clean visual logic puzzle component (maze, matching, sorting, pattern, or logic grid). The image should be the PUZZLE itself, clear, uncluttered, and solvable visually. Use A4 portrait composition with a 12mm safe margin. Keep the puzzle centered, use generous whitespace, and avoid filling more than ~70% of the activity field. Do NOT draw a border or frame.";
            break;
        case 'tracing':
            layoutInstruction = "1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene filling the TOP 70% of the canvas with ONE main subject. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white) for writing practice. Use A4 portrait composition with a 12mm safe margin. Keep the scene centered and uncluttered. Do NOT draw a piece of paper.";
            break;
        case 'science':
            layoutInstruction = "1. LAYOUT: Create a clear, focused educational illustration or diagram related to the topic. Use 'exploded view' or clear labeling points if appropriate, but with NO text. Avoid unnecessary decorative clutter. Use A4 portrait composition with a 12mm safe margin and generous whitespace. This should be an INFORMATIONAL visual, not a story scene.";
            break;
        case 'math':
            layoutInstruction = `1. LAYOUT: Create an image with clear, DISCRETE, COUNTABLE items related to the topic (e.g., 5 distinct apples in a row). The count should be between 1 and ${mathMaxCount} for clarity. The items must be easy to distinguish and count. Use A4 portrait composition with a 12mm safe margin. Keep the composition centered with generous whitespace and avoid filling more than ~70% of the activity field. Keep the background minimal. Do NOT draw a border or frame.`;
            break;
        case 'art':
            layoutInstruction = "1. LAYOUT: Create a visual suitable for art crafting. If instructed for coloring, create a full-page scene with large open white spaces inside shapes and avoid complex shading. Use A4 portrait composition with a 12mm safe margin, centered subject, and generous whitespace. Include a main subject and a simple background environment.";
            break;
        case 'reading':
            layoutInstruction = "1. LAYOUT: Create a narrative scene that depicts a specific moment or character from a story. It should look like a professional children's book illustration plate, focused on storytelling and mood. Use A4 portrait composition with a 12mm safe margin and generous whitespace. One central action.";
            break;
        default:
            layoutInstruction = "1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene with ONE main subject. Do NOT overcrowd the image. Do NOT draw a border or frame.";
    }

    const tracingInstruction = isTracing
        ? (input.simpleTracingPaths 
            ? `1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene filling the TOP 70% of the canvas with ONE main subject. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white). Use A4 portrait composition with a 12mm safe margin. Do NOT overcrowd the top scene. Do NOT draw a piece of paper.\n5. COMPOSITION: Leave room for tracing practice. CRITICAL: Provide a SIMPLE SINGLE-STROKE DOTTED LINE path related to the drawing. Do NOT use outlines, double lines, or 'road' shapes for the path. Just a simple dashed line.`
            : `1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene filling the TOP 70% of the canvas with ONE main subject. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white). Use A4 portrait composition with a 12mm safe margin. Do NOT overcrowd the top scene. Do NOT draw a piece of paper.\n5. COMPOSITION: Leave room for tracing practice.`)
        : "";

    // Age-Tailored Visuals in Image Prompt
    const ageInstruction = `Age/Grade target: ${profile.age}-year-old (${profile.grade_level}). Adjust visual complexity appropriately. For younger kids, use appealing, simple, and beautifully proportioned shapes. For older kids, create detailed but UNCLUTTERED art. ABSOLUTELY NO scattered floating elements. The final result MUST look carefully composed by a professional children's book illustrator.`;

    const isColor = input.style === 'colorful';
    const isOutlineOnly = input.style === 'bw' && input.coloringBookMode;
    
    const styleEnforcement = isColor
        ? 'STYLE ENFORCEMENT: Output a fully colored, breathtaking, flat illustration suitable for a premium children\'s book. Use beautiful, harmonious color palettes, appealing character designs, and polished, professional composition.'
        : (isOutlineOnly
            ? 'STYLE ENFORCEMENT: Premium black-and-white coloring-page line art. Crisp expressive black outlines ONLY on a pure white background. Use varying line weights. No gray shading. Avoid large solid black fills.'
            : 'STYLE ENFORCEMENT: Black-and-white ink-saver illustration. Use clean black linework on a pure white background. No color. No gray shading or gradients. Avoid large solid black areas unless essential for clarity.');

    const imageStyleIntro = isColor
        ? `Generate a beautiful, highly engaging, and professionally polished colored illustration for a children's ${input.category} activity about "${input.topic}".`
        : `Generate elegantly designed, high-contrast, clean black and white line art optimized for A4 paper printing for a children's ${input.category} activity about "${input.topic}".`;


    const isCharacterTracing = input.category === 'tracing' && /number|digit|alphabet|letter/i.test(input.topic);

    const imagePrompt = `${imageStyleIntro}
Activity Type: ${input.category}
Topic: ${input.topic}

${styleEnforcement}
IMPORTANT THEME ENFORCEMENT: The illustrations MUST accurately reflect the specific topic: "${input.topic}". DO NOT add random characters, animals, or elements that don't make sense for the topic.
IMPORTANT THEME ENFORCEMENT: The illustrations MUST accurately reflect the specific topic: "${input.topic}". DO NOT add random characters, animals, or elements that don't make sense for the topic.

Dynamic Content to Visualize:
${dynamicPrompt}

Specific Instructions:
${layoutInstruction}
2. Visualize the items mentioned in the content exactly.
3. ${ageInstruction}
${tracingInstruction}
6. Keep lines simple, bold, and distinct.
7. NO TEXT OR LETTERS (EXCEPT TRACING): ${isCharacterTracing ? 'You ARE allowed to draw a large, centered, single dotted-outline digit or letter if it is the target of the tracing activity. Ensure it has NO solid fill.' : 'ABSOLUTELY NO WORDS, NUMBERS, OR CURSIVE SCRIPT in the image.'} 
8. FINAL CHECK: Ensure the background is PURE WHITE (#FFFFFF) with NO texture, gradient, or grey tint. Do not draw a physical page or frame.
Constraints: No shading or gradients to ensure maximum clarity on printing.`;

    return imagePrompt;
}
