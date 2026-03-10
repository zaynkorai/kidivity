# Art & Creation - Tasks

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
Art activities teach drawing, coloring, and simple crafts. The image is the activity, and text only supports the steps or prompt.

## 3. Target Ages
- Ages 3-5: 3-4 drawing steps, large coloring areas.
- Ages 6-8: 4-6 steps, moderate detail, simple craft cutouts.
- Ages 9-12: 6-8 steps, richer scenes, multi-part crafts.

## 4. Activity Types
- Step-by-step drawing
- Finish the drawing
- Coloring page
- Color by number or label
- Simple cut-and-paste crafts

## 5. Category Visual Rules
- Drawing steps must be incremental and minimal.
- Coloring pages must use closed shapes with thick outlines.
- Craft templates must have clear cut lines inside the safe area.

## 6. Generation Method
Constrained illustration with strict templates. Prefer vector output for crisp print. Enforce B&W for `bw` style.

## 7. Category-Specific Spec Additions
- art_subtype (drawing_steps, coloring, craft)
- final_subject
- steps_array
- step_panels_layout
- coloring_regions
- cut_lines
- materials_list

## 8. Validation Checklist
- Each step adds only new lines and preserves previous steps.
- Coloring regions are fully closed and larger than the minimum size.
- Cut lines remain within the safe area.
- Line weight is consistent and print friendly.

## 9. Acceptance Criteria
The activity is fully usable without extra explanation. The printed page is clear, balanced, and visually actionable.
