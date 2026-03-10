# Letters & Tracing - Tasks

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
Tracing activities build fine motor skills and pre-writing control. The activity is the path itself, with minimal supporting text.

## 3. Target Ages
- Ages 3-5: straight lines, simple curves, basic shapes.
- Ages 6-8: letters, numbers, connected shapes, simple mazes.
- Ages 9-12: multi-step paths, symmetry tracing, longer sequences.

## 4. Activity Types
- Letter tracing
- Number tracing
- Shape tracing
- Path tracing with start and end
- Trace the maze path

## 5. Category Visual Rules
- Use dotted or dashed strokes with consistent spacing.
- Clearly mark start and end points.
- Avoid intersecting paths unless explicitly labeled.

## 6. Generation Method
Fully programmatic vector generation for paths and guides. Use consistent dot spacing and stroke thickness across activities.

## 7. Category-Specific Spec Additions
- trace_paths (SVG path list)
- dot_spacing_mm
- stroke_weight_pt
- start_marker
- end_marker
- direction_arrows

## 8. Validation Checklist
- Path is continuous and within the safe area.
- Dot spacing is consistent and traceable.
- Start and end markers are visible and distinct.
- No crossings that create ambiguity.

## 9. Acceptance Criteria
A child can trace the path without confusion. The path is the main activity, and the image alone explains what to do.
