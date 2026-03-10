# Reading & Stories - Tasks

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
Reading activities build literacy through image-led prompts and short passages. The image carries the narrative or context, and text is short and supportive.

## 3. Target Ages
- Ages 3-5: single scene with a short prompt.
- Ages 6-8: two to three panels with simple sequencing.
- Ages 9-12: multi-panel sequences with richer detail and comprehension questions.

## 4. Activity Types
- Picture prompt story starter
- Sequence the story panels
- Find details in a story scene
- Match caption to scene
- Short passage with comprehension

## 5. Category Visual Rules
- Use consistent characters and settings within a story.
- Keep scenes readable with limited clutter and clear focus areas.
- Use numbered panels or arrows for sequence clarity.

## 6. Generation Method
Constrained illustration with storyboard templates. Use explicit object and relationship lists to reduce drift.

## 7. Category-Specific Spec Additions
- characters_list
- props_list
- setting
- panel_count
- panel_layout
- panel_object_map
- comprehension_questions

## 8. Validation Checklist
- All required characters and props are visible in each panel.
- Panel sequence is clear and unambiguous.
- Text does not introduce elements missing in the image.
- Composition is readable when printed.

## 9. Acceptance Criteria
The story can be understood and told using the images alone. The text only guides the activity.
