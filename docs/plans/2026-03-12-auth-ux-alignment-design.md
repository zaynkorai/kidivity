# Auth + UX Alignment Design

## Goal
Align auth/onboarding copy and visuals with the core Kidivity promise (printable, screen-free activities), improve activity card legibility, and document unimplemented actions without changing behavior.

## Scope
- Update auth and onboarding copy to emphasize printable, screen-free activities tailored to a child’s age/grade.
- Harmonize auth screen palette with the core design tokens in `constants/theme.ts`.
- Improve small-type legibility in activity cards by using tokenized font sizes and higher-contrast text colors.
- Implement Google/Apple OAuth and Delete Account flows.

## UX Rationale
The product’s value is offline learning through printable activities. Auth screens currently suggest “expertise and knowledge” or “screen-time,” which risks misaligned expectations before first use. Tightening copy to “printable, screen-free activities” clarifies the core promise and matches the generate flow language. Visual parity is reinforced by swapping custom auth palette values with theme tokens so onboarding feels like part of the same product system rather than a separate brand surface.

Small text in the activities grid (9–11px) is hard to read on small devices and reduces scanability. Raising these labels to tokenized sizes (`FontSize.xs`) and using `textSecondary` for dates improves legibility without expanding layout density significantly. This keeps the card format compact while being more accessible for parents.

Previously unimplemented actions should remain visible to preserve perceived capability during MVP validation, and are now implemented to prevent long-term UX gaps.

## Non-Goals
- No functional changes to OAuth, account deletion, or backend flows.
- No new screens or component architecture changes.
- No redesign of navigation or layout structures.

## Success Criteria
- Auth/onboarding text clearly communicates printable, screen-free value.
- Auth screens visually align with core brand tokens.
- Activity grid microtext is legible at arm’s length on small devices.
- OAuth and account deletion flows are implemented without UX changes.
