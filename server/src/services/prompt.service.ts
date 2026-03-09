import { GenerateBody } from '../schemas/activity.schema.js';

// ── System instruction ───────────────────────────────────
export function buildSystemInstruction(profile: any): string {
    return `You are Kidivity, an expert pedagogical AI specializing in creating high-quality, printable activities for children.
    
You always respond with well-structured, scientifically accurate, and age-appropriate content.
EVERY activity you generate MUST be a highly polished, professional-grade educational product suitable for a premium workbook.

CORE CONSTRAINTS:
- Never use conversational filler (e.g., do not say "Here is your activity" or "Enjoy").
- Format your response in clean, strict Markdown (# for main titles, ## for sections, > for parent notes).
- Use language and concepts perfectly tailored to the child's age and grade.
- Strictly no emojis; use professional formatting.

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Grade: ${profile.grade_level}
- Interests: ${(profile.interests || []).join(', ')}`;
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
            
            STRUCTURE REQUIREMENTS:
            1. # [Fun Theme Title]
            2. > **Parent Note:** Briefly explain the logic rule used.
            3. ## The Challenge
               [Present the puzzle setup clearly so it can be solved on paper].
            4. ## Instructions
               - Step-by-step guidance for the child.
            5. ---
            6. **Answer Key:** [Provide the solution clearly at the bottom]`;
            break;
            
        case 'tracing':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} tracing and pen-control practice activity about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            STRUCTURE REQUIREMENTS:
            1. # Let's Trace: [Fun Title]
            2. > **Parent Note:** Guide the child to practice their fine motor skills.
            3. ## Story Time
               - A short, 2-sentence fun description of the ${input.topic} illustration they see on the page.
            4. ## Tracing Practice
               - List 3-5 CONCRETE NOUNS related to "${input.topic}" that are easy for a child to visualize and write.
            
            CONSTRAINT: Output the words clearly. The app UI will handle the dotted-line rendering.`;
            break;
            
        case 'science':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} educational fact sheet and quiz about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            PEDAGOGICAL CONSTRAINT: Focus on objective facts and knowledge. Do NOT use a fictional narrative or character-driven story here (use the 'story' category for that).
            
            STRUCTURE REQUIREMENTS:
            1. # Discovering [Topic]
            2. ## The Big Idea
               - A short, engaging reading passage explaining the concept clearly.
            3. ## Did You Know?
               - 3-5 amazing, age-appropriate fun facts.
            4. ## Mini Quiz
               - 3 interactive questions (multiple choice or true/false) to test comprehension.
            5. > **Parent Tip:** A prompt for a discussion question to ask the child.`;
            break;
            
        case 'art':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} art and creation activity about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}). Time: 15-30 minutes.
            
            FOCUS: Depending on the topic, provide either step-by-step drawing instructions, a coloring page description, or craft instructions related to "${input.topic}".
            
            STRUCTURE REQUIREMENTS:
            1. # Art Time: [Fun Title]
            2. > **Parent Note:** What the child will learn (creativity, fine motor skills).
            3. ## Materials Needed
                - Bulleted list (ONLY common household art supplies).
            4. ## Instructions
                - Clear, numbered steps or a creative prompt for the child to follow.`;
            break;
            
        case 'math':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} math and counting activity about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            FOCUS: Counting, simple addition, or number logic. 
            NON-OVERLAP CONSTRAINT: Do NOT use complex visual patterns or abstract mazes; focus purely on numbers, increments, and arithmetic.
            
            STRUCTURE REQUIREMENTS:
            1. # Math Fun: [Fun Title]
            2. > **Parent Note:** Help the child practice numbers and logic.
            3. ## The Math Challenge
                - Present 3-4 simple word problems or counting exercises related to "${input.topic}".
            4. ---
            5. **Answer Key:** [Provide the solutions clearly at the bottom]`;
            break;

        case 'reading':
            categoryPrompt = `Task: Create a professional-grade ${input.difficulty} reading exercise or short story about "${input.topic}".
            Target: ${profile.age}-year-old (${profile.grade_level}).
            
            PEDAGOGICAL CONSTRAINT: Focus on a fictional tale or reading comprehension.
            
            STRUCTURE REQUIREMENTS:
            1. # Story Time: [Fun Title]
            2. > **Parent Note:** Read together or have the child read independently, based on their level.
            3. ## The Tale
                - A fun, engaging 2-3 paragraph short story about "${input.topic}".
            4. ## Think About It
                - 2 reading comprehension questions.`;
            break;
            
        default:
            categoryPrompt = `Create a professional-grade, fun, and engaging lesson about "${input.topic}". Ensure it is structured with headings.`;
    }

    return `CRITICAL: Output ONLY the Markdown content. Start directly with the title (#). Do not include introductory text.
CRITICAL QUALITY STANDARD: Every activity generated MUST be a highly polished, professional-grade educational activity. DO NOT output basic or low-effort content.
Style: ${style}
Difficulty: ${input.difficulty}

${categoryPrompt}`;
}

export function buildImagePrompt(profile: any, input: GenerateBody): string {
    const topInterests = (profile.interests || []).slice(0, 3).join(', ');
    const isTracing = input.category === 'tracing';
    const isPuzzles = input.category === 'puzzles';
    const isScience = input.category === 'science';
    const isMath = input.category === 'math';
    const isArt = input.category === 'art';
    const isReading = input.category === 'reading';

    let layoutInstruction = "";
    
    switch (input.category) {
        case 'puzzles':
            layoutInstruction = "1. LAYOUT: Create a clean visual logic puzzle component (like a simple maze, spot the difference, matching element, or visual grid). The image should be the PUZZLE itself, clear, uncluttered, and solvable visually. Do NOT draw a border around the image.";
            break;
        case 'tracing':
            layoutInstruction = "1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene filling the TOP 70% of the canvas with ONE main subject. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white) for writing practice. Do NOT draw a piece of paper.";
            break;
        case 'science':
            layoutInstruction = "1. LAYOUT: Create a clear, focused educational illustration or diagram related to the topic. Use 'exploded view' or clear labeling points if appropriate, but with NO text. Avoid unnecessary decorative clutter. This should be an INFORMATIONAL visual, not a story scene.";
            break;
        case 'math':
            layoutInstruction = "1. LAYOUT: Create an image with clear, DISCRETE, COUNTABLE items related to the topic (e.g., 5 distinct apples in a row). The count should be between 1 and 10 for clarity. The items must be easy to distinguish and count for a young child. Keep the background minimal. Do NOT draw a border.";
            break;
        case 'art':
            layoutInstruction = "1. LAYOUT: Create a visual suitable for art crafting. If instructed for coloring, create a full-page scene with large open white spaces inside shapes and avoid complex shading. Include a main subject and a simple background environment.";
            break;
        case 'reading':
            layoutInstruction = "1. LAYOUT: Create a narrative scene that depicts a specific moment or character from a story. It should look like a professional children's book illustration plate, focused on storytelling and mood. One central action.";
            break;
        default:
            layoutInstruction = "1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene with ONE main subject. Do NOT overcrowd the image. Do NOT draw a border or frame.";
    }

    const tracingInstruction = isTracing
        ? (input.simpleTracingPaths 
            ? `1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene filling the TOP 70% of the canvas with ONE main subject. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white). Do NOT overcrowd the top scene. Do NOT draw a piece of paper.\n5. COMPOSITION: Leave room for tracing practice. CRITICAL: Provide a SIMPLE SINGLE-STROKE DOTTED LINE path related to the drawing. Do NOT use outlines, double lines, or 'road' shapes for the path. Just a simple dashed line.`
            : `1. LAYOUT: Create a SINGLE, CLEAR, FOCUSED scene filling the TOP 70% of the canvas with ONE main subject. The BOTTOM 30% of the canvas MUST be left completely blank and empty (pure white). Do NOT overcrowd the top scene. Do NOT draw a piece of paper.\n5. COMPOSITION: Leave room for tracing practice.`)
        : "";

    // Age-Tailored Visuals in Image Prompt
    const ageInstruction = `Age/Grade target: ${profile.age}-year-old (${profile.grade_level}). Adjust visual complexity appropriately. For younger kids, use appealing, simple, and beautifully proportioned shapes. For older kids, create detailed but UNCLUTTERED art. ABSOLUTELY NO scattered floating elements. The final result MUST look carefully composed by a professional children's book illustrator.`;

    const isBwForcedCategory = input.category === 'art';
    const effectiveIsColor = isBwForcedCategory ? false : (input.style === 'colorful');
    const effectiveIsOutlineOnly = isBwForcedCategory || (input.style === 'bw' && input.coloringBookMode);
    
    const styleEnforcement = effectiveIsOutlineOnly
        ? 'STYLE ENFORCEMENT: Premium, professional-quality black and white coloring page. The art should feature beautifully composed, elegant line work with natural flow. Use varying line weights for depth. Do NOT use solid blacks or grays for objects. The image MUST consist of pure white backgrounds with crisp, expressive black outlines ONLY.'
        : 'STYLE ENFORCEMENT: Output a fully colored, breathtaking, flat illustration suitable for a premium children\'s book. Use beautiful, harmonious color palettes, appealing character designs, and polished, professional composition.';

    const imageStyleIntro = effectiveIsColor
        ? `Generate a beautiful, highly engaging, and professionally polished colored illustration for a children's ${input.category} activity about "${input.topic}".`
        : `Generate elegantly designed, high-contrast, clean black and white line art (no gray shading, pure white background, pure black outlines) optimized for A4 paper printing for a children's ${input.category} activity about "${input.topic}".`;

    const interestNote = topInterests 
        ? `Theme Note: The child loves ${topInterests}. You may incorporate these ONLY IF they naturally fit the topic, otherwise stick purely to the topic.` 
        : '';

    const imagePrompt = `${imageStyleIntro}
Activity Type: ${input.category}
Topic: ${input.topic}

${styleEnforcement}
IMPORTANT THEME ENFORCEMENT: The illustrations MUST accurately reflect the specific topic: "${input.topic}". ${interestNote} DO NOT add random characters, animals, or elements that don't make sense for the topic.

Specific Instructions:
${layoutInstruction}
2. Visualize the items mentioned in the content exactly.
3. ${ageInstruction}
${tracingInstruction}
6. Keep lines simple, bold, and distinct.
7. NO TEXT OR LETTERS: ABSOLUTELY NO WORDS, NUMBERS, OR CURSIVE SCRIPT in the image. The AI text engine will handle the text separately. 
8. **FINAL CHECK**: Ensure the background is PURE WHITE (#FFFFFF) with NO texture, gradient, or grey tint. Do not draw a physical page or frame.
Constraints: No shading or gradients to ensure maximum clarity on printing.`;

    return imagePrompt;
}