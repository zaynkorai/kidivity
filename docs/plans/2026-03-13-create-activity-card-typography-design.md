# Create Activity Card Typography Lock (iOS/Android Parity)

## Goal
Ensure the Home screen “Create Activity” card renders identically on iOS and Android, matching the expected single-line title/subtitle and overall card height.

## Problem
On iOS, the card appears bloated: the title wraps to a second line and the card height increases. The root cause is iOS font metrics combined with Dynamic Type scaling that inflates text sizes and line boxes relative to Android.

## Approach
Lock typography scaling on the card’s text nodes only, and explicitly set line heights for consistent vertical rhythm. Clamp the title and subtitle to single lines so the layout matches the expectation image.

## Planned Changes
- Add a shared `noScale` prop (`allowFontScaling=false`, `maxFontSizeMultiplier=1`) in the Home screen component.
- Apply `noScale` to all text nodes inside the Create Activity card (eyebrow, title, subtitle, chips, CTA, and “Open last”).
- Set explicit `lineHeight` values for the card’s key text styles.
- Clamp title and subtitle to a single line with ellipsis to prevent reflow.

## Alternatives Considered
- Keep Dynamic Type and only reduce iOS padding/lineHeight: reduces bloat but does not guarantee parity.
- Fixed card height: guarantees layout but risks truncation on smaller screens.

## Risks
- Disabling scaling reduces accessibility for this card only. This is acceptable to meet strict visual parity requirements.
- Single-line clamping may truncate very long subtitle text on small screens.

## Testing
- Visual check on iOS and Android for single-line title/subtitle and matching card height.
- Smoke test the “Open last” button and Generate CTA to ensure interactivity remains unchanged.
