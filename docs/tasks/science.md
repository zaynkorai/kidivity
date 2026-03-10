# Science & Discovery - Tasks

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
Science activities teach facts, observation, and discovery through diagrams, simple experiments, and visual prompts. The image leads, and text supports the learning goal.

## 3. Target Ages
- Ages 3-5: simple labeling, picture-word matching, basic categories.
- Ages 6-8: life cycles, simple experiments, cause and effect.
- Ages 9-12: richer diagrams, multi-step experiments, basic scientific reasoning.

## 4. Activity Types
- Label the parts (animal, plant, object)
- Match object to category
- Sequence the steps (life cycle or experiment)
- Observation checklist
- Simple science facts with visual prompts

## 5. Category Visual Rules
- Use clean diagrams or simple scenes with limited detail.
- Favor icons and clearly separated objects.
- Keep callout lines and labels readable.

## 6. Generation Method
Hybrid. Programmatic layouts for diagrams, labeling, and sequencing. Constrained illustration for scenes that require context.

## 7. Category-Specific Spec Additions
- topic_subtype
- diagram_type
- labels_list
- callout_positions
- sequence_steps
- experiment_steps
- safety_notes

## 8. Validation Checklist
- Every label maps to a visible object with a callout.
- Visuals match the stated topic precisely.
- Experiment steps are safe, simple, and non-hazardous.
- Instruction text does not introduce unseen objects.

## 9. Acceptance Criteria
A child can learn or answer using the image alone. The text only clarifies the task and does not introduce new unseen elements.
