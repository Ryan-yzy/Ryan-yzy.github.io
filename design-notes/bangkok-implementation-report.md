# Bangkok Life Note Implementation Report

Date: 2026-06-26

Branch: `design/life-note-sketch-redesign`

## Skill Installation

- `claude-design`
  - Path: `.agents/skills/claude-design/`
  - Source: `https://github.com/jiji262/claude-design-skill`
  - Upstream commit: `f1ac87c3decb175d99a269f23ca84860786a598b`
  - Preferred command: `npx skills add jiji262/claude-design-skill --skill claude-design --agent codex -y`
  - Actual method: manual project-level install because `node`, `npm`, and `npx` were not available on PATH.
- `sketch`
  - Path: `.agents/skills/sketch/`
  - Source: `https://github.com/NousResearch/hermes-agent`
  - Upstream commit: `a4091e49f10ddceaac1a902848aabfb1b9aae210`
  - Preferred command: `npx skills add NousResearch/hermes-agent --skill sketch --agent codex -y`
  - Actual method: manual project-level install from the upstream raw `SKILL.md`.

Installed skill details are documented in `docs/design-skills.md`.

## Sketch Options

1. `001-editorial-rhythm`
   - Restrained travel magazine rhythm.
   - Uses offset Wat Arun pair, narrower supporting images, asymmetric crocodile/mall split, and 1+2 food layout.
2. `002-photo-essay`
   - More photo-led.
   - Uses wider scene images and a stacked crocodile/mall sequence.
3. `003-quiet-journal`
   - More private diary-like.
   - Uses smaller images and an inset-like crocodile detail after the mall scene.

## Scores

| Variant | Desktop | Mobile | Weighted |
| --- | ---: | ---: | ---: |
| Editorial Rhythm | 92 | 88 | 90 |
| Photo Essay | 88 | 82 | 86 |
| Quiet Journal | 84 | 92 | 88 |

Selected direction: `001-editorial-rhythm`, with mobile restraint borrowed from `003-quiet-journal`.

## Production Layout Choice

The production page now uses:

- Offset Wat Arun opening pair.
- Narrower standalone portrait images.
- Wider but bounded landscape river-house image.
- Compact shooting target image.
- Asymmetric food group with one main image and two supporting images.
- Dedicated `life-note-contrast` section for the crocodile/mall moment.

The crocodile contrast section uses:

- Mall image as the larger environment/scene.
- Crocodile image as the smaller detail/reversal.
- A shared weak label: `同一条河的两种生活`.
- Single-column mobile fallback with the crocodile image kept narrower.

## Validation

Static checks passed:

- 13 article images.
- 13 `<figure>` elements.
- 13 `<figcaption>` elements.
- 13 `alt` attributes.
- 13 `loading="lazy"` attributes.
- 13 `decoding="async"` attributes.
- 8 Markdown section headings, including `写在最后`.
- No `file:///` paths in the production article.
- No `<script>` in the production article.
- Crocodile/mall section no longer uses the generic equal-width gallery.
- Wat Arun and food groups use dedicated asymmetric classes.

Browser screenshots:

- Current online top screenshots saved in `tmp/design-review/`.
- Three sketch variants were opened in Edge headless.
- 84 viewport/anchor screenshot attempts were generated in `tmp/design-review/sketch-screenshots/`.
- Edge headless did not reliably honor hash-anchor scrolling, so 12 long screenshots by width were generated in `tmp/design-review/sketch-fullpage/` for visual review.

Jekyll commands:

```text
bundle install -> failed: bundle not available on PATH
bundle exec jekyll build -> failed: bundle not available on PATH
bundle exec jekyll serve --host 0.0.0.0 --port 4000 -> failed: bundle not available on PATH
```

Environment checks:

```text
ruby --version -> not available on PATH
bundle --version -> not available on PATH
docker --version -> not available on PATH
```

## Manual Visual Items To Recheck After CI Build

- Confirm GitHub Pages build succeeds.
- Open `/life-notes/travel/thailand-malaysia-bangkok/` at 1440, 1024, 768, 390, and 360px widths.
- Confirm the masthead and page no longer create horizontal scrolling on mobile.
- Confirm the crocodile image remains smaller than the mall scene on mobile.
- Confirm the food group does not overpower the ending.
