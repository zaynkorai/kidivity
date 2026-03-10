# Activity Image Fidelity - Design

## Goals
The goal is to make the generated image the primary activity artifact, with text as supporting guidance only. Images must be A4-printable, legible in black and white, and consistent across categories and age bands. The system must prevent drift between the text and the image by enforcing a shared schema, category constraints, and machine-checkable validation rules. Accuracy and printability are higher priority than visual novelty.

## Non-Goals
This design does not select a specific model or vendor for image generation. It does not define pricing, user flows, or new UI screens. It does not add new categories beyond the current six.

## Architecture
The generation pipeline is spec-first. Input data (kid profile, category, topic, difficulty, style) becomes a normalized Activity Spec. The Activity Spec is fed into a renderer that either produces a programmatic layout or a constrained illustration template. A validator then checks the output against strict rules: margin compliance, minimum sizes, required object counts, and text-to-image alignment. If validation fails, regeneration is triggered with tighter constraints, or the activity is rejected. This architecture treats the Activity Spec as the source of truth and keeps text derived from the same spec to avoid mismatch.

## Components
- Activity Spec Builder: Normalizes input and expands into a full spec with layout and required objects.
- Renderer: Programmatic for structured categories (puzzles, tracing, math) and constrained illustration for art, science, reading.
- Validator: Verifies margin rules, object counts, missing elements, and minimum size thresholds.
- Output Formatter: Exports SVG or PDF when possible, PNG at 300 DPI otherwise.

## Data Flow
User input flows into the Activity Spec Builder. The renderer produces the image using the spec. The validator inspects the output. If the output fails, a regeneration loop occurs with stricter constraints. On success, both image and text are returned, with text derived from the same spec to guarantee alignment.

## Error Handling
If the validator cannot resolve failures after a fixed number of attempts, the activity is rejected with a clear error code indicating the failing rule. The system should log the spec and validator errors for future tuning.

## Testing
- Golden tests for each category and age band using fixed specs.
- Validator unit tests for margin, size, and count rules.
- Visual regression checks for line weight and spacing consistency.
- Print tests for A4 output at 300 DPI.
