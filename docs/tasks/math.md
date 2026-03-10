# Math & Numbers - Tasks

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
Math activities build number sense and basic operations. The image contains the countable elements and the numeric prompt.

## 3. Target Ages
- Ages 3-5: counting, number recognition, simple comparisons.
- Ages 6-8: addition and subtraction within 20, simple word problems.
- Ages 9-12: multi-step operations, patterns, simple fractions.

## 4. Activity Types
- Count the objects
- Fill the number line
- Simple addition and subtraction
- Compare greater or less
- Match equation to picture

## 5. Category Visual Rules
- Use clean repeated objects with uniform sizing.
- Avoid tiny details that make counting hard.
- Keep object spacing consistent and countable.

## 6. Generation Method
Fully programmatic for object counts, grids, and number lines to ensure accuracy.

## 7. Category-Specific Spec Additions
- operands
- target_answer
- object_type
- object_count
- equation_list
- number_line_range
- grid_config

## 8. Validation Checklist
- Object count matches the numeric prompt exactly.
- Each equation maps to visible objects or number lines.
- Number line ticks and labels are consistent with range.
- No duplicate or missing objects.

## 9. Acceptance Criteria
A child can solve the math task using the image alone. The visual count or structure directly represents the math problem.
