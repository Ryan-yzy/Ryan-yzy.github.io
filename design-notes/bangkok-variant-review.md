# Bangkok Life Note Variant Review

Date: 2026-06-26

Sketches reviewed:

- `sketches/bangkok-life-note/001-editorial-rhythm/`
- `sketches/bangkok-life-note/002-photo-essay/`
- `sketches/bangkok-life-note/003-quiet-journal/`

Browser screenshots:

- 84 viewport/anchor screenshot attempts saved to `tmp/design-review/sketch-screenshots/`
- 12 long review screenshots saved to `tmp/design-review/sketch-fullpage/`

Note: Edge headless did not honor hash anchors reliably for scrolled screenshots, so long screenshots at the same widths were used to inspect the key sections.

## Scoring Standard

| Dimension | Weight |
| --- | ---: |
| Chinese long-form readability | 25% |
| Text/image relationship | 20% |
| Aspect-ratio handling | 15% |
| Crocodile contrast section | 20% |
| Mobile behavior | 15% |
| Coordination with academic homepage | 5% |

## 001 Editorial Rhythm

Strengths:

- Best overall balance between article readability and travel-magazine rhythm.
- Wat Arun pair feels intentional because one image sits lower and the two are not treated as a rigid wall.
- Ordinary street and traffic photos stay narrow enough to support the prose.
- Crocodile/mall contrast works best: mall image carries the environment, crocodile image becomes a smaller detail and reversal.
- Mobile remains readable, with images collapsing naturally into a single column.

Weaknesses:

- More designed than the quiet journal variant, so it needs restraint in production spacing and color.
- Food group needs careful sizing so the large food image does not overpower the ending.

Risks:

- If translated too literally into production SCSS, the offset photo rhythm could become too busy.

Desktop score: 92/100  
Mobile score: 88/100  
Weighted score: 90/100

## 002 Photo Essay

Strengths:

- Strongest photo/story binding.
- Wider landscape images feel good for the river houses.
- Crocodile/mall section uses a clean stacked sequence, avoiding unequal side-by-side pressure.
- Food group has more photographic energy.

Weaknesses:

- The reading column feels slightly interrupted by larger photo moments.
- Some desktop image sizes are close to becoming a photo layout rather than a prose-led article.
- Mobile is acceptable but less calm than the quiet journal option.

Risks:

- Could drift away from the personal, restrained voice of the original travel note.

Desktop score: 88/100  
Mobile score: 82/100  
Weighted score: 86/100

## 003 Quiet Journal

Strengths:

- Most stable mobile reading flow.
- The smaller images fit the first-person diary tone well.
- Crocodile image works as a small inset-like detail after the mall scene.
- Closest to the existing academic homepage restraint.

Weaknesses:

- Desktop lacks enough editorial energy for this redesign brief.
- Wat Arun opening loses some of the scale and drama of the low-cloud premise.
- Food group becomes a simple vertical sequence, which is safe but less memorable.

Risks:

- May solve the template problem by becoming too plain.

Desktop score: 84/100  
Mobile score: 92/100  
Weighted score: 88/100

## Decision

Selected direction: `001-editorial-rhythm`, with mobile restraint borrowed from `003-quiet-journal`.

Reason:

- It best preserves the prose-led article while giving the page a clearer editorial rhythm.
- It solves the crocodile/mall problem without forcing equal widths or equal heights.
- It keeps the academic homepage's quiet tone, but no longer feels like a generic article template.
- It provides enough design structure to improve the Wat Arun opening and food section without making the page feel decorative.

## Crocodile Contrast Choice

Use an asymmetric editorial split:

- Mall image: larger environment/scene image.
- Crocodile image: smaller detail/reversal image.
- Shared weak label: `同一条河的两种生活`.
- Desktop: two-column asymmetric layout with different visual weights and natural image heights.
- Mobile: scene first, detail second; crocodile image stays narrower and centered.

This is stronger than an equal grid because the two photos have opposite aspect ratios and different narrative jobs.
