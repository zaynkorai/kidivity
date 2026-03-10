# Puzzles & Logic - Tasks

## 0. Global Baseline (All Categories)
- Page size: A4 portrait, 210 x 297 mm.
- Safe area: 12 mm margin on all sides. No elements outside.
- Layout bands: title band 10-12% height, single instruction line below it, remaining area is the Activity Field.
- Output: vector SVG or PDF preferred. If raster, 300 DPI minimum.
- Color modes: `bw` uses 100% black strokes only. No grayscale, shading, or gradients. `colorful` uses 4-6 flat colors.
- Line weight: primary strokes 1.2-1.6 pt, secondary strokes >= 0.9 pt.
- Text size: title 20-24 pt, instructions 12-14 pt, labels >= 12 pt.
- Minimum object size: 4 mm smallest dimension.
- Minimum spacing: 6 mm between interactive elements, 4 mm between decorative elements.
- Density cap: no more than 70% of Activity Field filled to preserve white space.
- Accuracy rule: every object referenced by text must exist in the image, and text must not introduce unseen objects.

## 1. Global Activity Spec Schema (All Categories)
- category_id
- age_band
- difficulty
- activity_type
- topic
- layout_grid (rows, cols, gutters_mm)
- safe_area_mm
- title_text
- instruction_text
- visual_tokens (line_weight_pt, dot_spacing_mm, corner_radius_mm, color_mode, palette, font_family, font_sizes_pt)
- required_objects (name, count, size_min_mm, attributes, placement_zone)
- optional_objects
- forbidden_objects
- interaction_zones (label, bbox_mm, type)
- answer_key (if applicable)
- output_requirements (format, dpi, color_mode)

## 2. Category Scope
Puzzle activities build pattern recognition, deduction, and visual reasoning through mazes, matching, sorting, and sequences. This category excludes pure arithmetic and freehand drawing.

## 3. Target Ages
- Ages 3-5: simple matching, same/different, odd-one-out, 2-3 step sequences.
- Ages 6-8: multi-step patterns, grid matching, simple logic grids.
- Ages 9-12: larger grids, multi-constraint puzzles, advanced pattern rules.

## 4. Activity Types
- Sequence completion
- Pattern matching and repetition
- Odd-one-out
- Same/different sorting
- Connect pairs and matching
- Simple logic grids
- Visual mazes with constraints

## 5. Category Visual Rules
- Use clean line art with geometric shapes or simple icons.
- Avoid heavy detail and keep spacing generous.
- Use consistent symbol sizing within a grid.

## 6. Generation Method
Primary programmatic layout for grids, sequences, and matching. Constrained illustration only when a scene is required for a specific puzzle type.

## 7. Category-Specific Spec Additions
- puzzle_rule
- solution_type (single, multiple)
- grid_rows, grid_cols
- symbol_set
- distractor_count
- maze_path (if maze)
- matching_pairs (if matching)

## 8. Validation Checklist
- All required symbols are present with the correct counts.
- Puzzle rule yields the expected number of solutions.
- Maze has one continuous solvable path when required.
- No overlap, clipping, or margin violations.
- Instruction text only references visible symbols.

## 9. Acceptance Criteria
The image alone communicates the puzzle. A parent can understand the task at a glance, and the solution is derivable without relying on extra text.
