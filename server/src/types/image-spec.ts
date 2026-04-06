/**
 * Structured image specification produced by Gemini and consumed by our
 * deterministic prompt compiler. Gemini fills in WHAT to show.
 * buildImagePrompt() controls HOW it is described to Imagen.
 *
 * Every user-facing input option (category, difficulty, style,
 * coloringBookMode, simpleTracingPaths) AND every meaningful topic
 * variation (topic_type, color_palette) has a corresponding
 * discriminating field so the compiler branches precisely.
 */

// ── Layout ────────────────────────────────────────────────────────────────────

export type CompositionLayout =
    | 'centered_single'          // one subject, generous whitespace
    | 'row_layout'               // items in a horizontal row
    | 'grid_layout'              // items in a grid
    | 'two_group_layout'         // two distinct groups side by side (addition, comparison)
    | 'ring_layout'              // stages arranged in a clockwise circle (lifecycle)
    | 'two_column_table'         // two columns for comparison (science comparison)
    | 'two_panel_identical'      // two near-identical panels side by side (spot differences)
    | 'scene_with_bg'            // characters in an environment
    | 'diagram'                  // science diagram / cross-section
    | 'multi_panel'              // 2-4 sequential panels (art steps, comic strip)
    | 'top_scene_blank_bottom';  // tracing: scene top 65%, empty bottom 35%

// ── Scene type ────────────────────────────────────────────────────────────────

export type SceneType =
    // ── Math ──────────────────────────────────────────────────────────────────
    | 'math_counting'            // discrete objects to count
    | 'math_addition'            // two groups being combined
    | 'math_subtraction'         // objects being removed from a group
    | 'math_comparison'          // side-by-side quantity comparison (more/fewer)

    // ── Reading ───────────────────────────────────────────────────────────────
    | 'character_story'          // single story moment
    | 'reading_comic'            // 3–4 panel narrative strip

    // ── Science ───────────────────────────────────────────────────────────────
    | 'science_lifecycle'        // circular/ring lifecycle stages
    | 'science_anatomy'          // labeled cross-section or body parts
    | 'science_comparison'       // two-column comparison of two subjects
    | 'science_diagram'          // general diagram / labeled illustration

    // ── Puzzles ───────────────────────────────────────────────────────────────
    | 'puzzle_maze'
    | 'puzzle_matching'
    | 'puzzle_pattern'
    | 'puzzle_odd_one_out'
    | 'puzzle_sorting'
    | 'puzzle_spot_differences'  // two nearly identical images

    // ── Art ───────────────────────────────────────────────────────────────────
    | 'art_coloring'
    | 'art_drawing_steps'
    | 'art_craft_template'

    // ── Tracing ───────────────────────────────────────────────────────────────
    | 'tracing_character'
    | 'tracing_scene';

// ── Topic type ────────────────────────────────────────────────────────────────
// Tells the compiler what NATURE the topic has, so it can give Imagen
// the right rendering instruction (e.g. concrete noun vs. iconic metaphor).

export type TopicType =
    | 'animal'      // cat, butterfly, dinosaur, fish
    | 'plant'       // flower, tree, vegetable, seed
    | 'object'      // vehicle, toy, food item, household item
    | 'person'      // child, firefighter, family, doctor
    | 'place'       // farm, ocean, forest, city
    | 'process'     // water cycle, cooking, building, growing
    | 'concept';    // weather, seasons, emotions, time, numbers as ideas

// ── Color palette ─────────────────────────────────────────────────────────────
// Gemini picks based on topic — lets the compiler map to a real color set.

export type ColorPalette =
    | 'warm'        // golden yellow, soft orange, coral — autumn, food, warmth
    | 'cool'        // sky blue, aqua, soft purple — ocean, space, winter
    | 'natural'     // leafy green, bark brown, earth tan — forest, garden, animals
    | 'pastel'      // soft pink, baby blue, mint — baby animals, gentle stories
    | 'vibrant'     // bold primaries — fun puzzles, math, bright art activities
    | 'neutral';    // light grey tones — when color is irrelevant (bw override)

// ── Subject ───────────────────────────────────────────────────────────────────

export interface VisualSubject {
    /** Concrete singular noun. e.g. "apple", "butterfly", "boy" */
    noun: string;
    /** How many appear. Must be 1–20. */
    count: number;
    /** Optional: color, size, state. e.g. "red", "smiling", "open" */
    descriptor?: string;
}

// ── Main spec ─────────────────────────────────────────────────────────────────

export interface ImageSpec {
    /**
     * Determines which visual grammar the compiler uses.
     * Pick the most specific type — "puzzle_maze" not "puzzle_grid".
     */
    scene_type: SceneType;

    /** Spatial arrangement of subjects. */
    layout: CompositionLayout;

    /**
     * Nature of the topic — lets the compiler tailor Imagen's instruction.
     * e.g. "concept" → "render through its most iconic concrete object, not an abstract symbol".
     */
    topic_type: TopicType;

    /**
     * Primary subjects. At least one required.
     * Use concrete, visualizable nouns only.
     */
    subjects: VisualSubject[];

    /**
     * For math_addition / math_subtraction:
     * subjects in group A (first operand).
     */
    group_a?: VisualSubject[];

    /**
     * For math_addition: subjects in group B (second operand).
     * For math_subtraction: objects being removed.
     * For math_comparison: the second comparison group.
     */
    group_b?: VisualSubject[];

    /** Environment in ≤5 concrete words. Use "plain white" when no background. */
    background: string;

    /**
     * Most important spatial relationship, sequence, or action.
     * For lifecycle: "egg → caterpillar → chrysalis → butterfly, clockwise".
     * For counting: "seven apples in a single row".
     * Empty string if none.
     */
    action: string;

    /**
     * TRACING ONLY — exact target: "uppercase A", "digit 5", "wavy line".
     * Empty string for all other categories.
     */
    tracing_target: string;

    /**
     * TRACING ONLY — drives simpleTracingPaths input flag.
     * true → add a single-stroke dashed guide path overlay.
     */
    tracing_has_path: boolean;

    /**
     * SCIENCE LIFECYCLE / ANATOMY / DIAGRAM — number of distinct stages or parts.
     * e.g. 4 for butterfly lifecycle. 0 if not applicable.
     */
    diagram_part_count: number;

    /**
     * ART DRAWING STEPS / READING COMIC — number of panels (2, 3, or 4).
     * 0 for all other scene types.
     */
    panel_count: number;

    /**
     * Color palette appropriate to the topic and age.
     * Ignored when style=bw. Compiler translates to specific color nouns for Imagen.
     */
    color_palette: ColorPalette;
}
