# Bangkok Life Note Current Audit

Date: 2026-06-26

Page reviewed: `https://ryan-yzy.github.io/life-notes/travel/thailand-malaysia-bangkok/`

Local files reviewed:

- `_posts/2026-06-24-thailand-malaysia-bangkok.md`
- `_layouts/life-note.html`
- `_sass/layout/_life-notes.scss`
- `assets/css/main.scss`

## Current Page Findings

- The page is already separated from the author sidebar through `layout: life-note`, but it still inherits the academic homepage masthead and much of the Minimal Mistakes rhythm.
- Desktop opening view reads cleanly but still feels like a centered academic article with inserted image blocks. The first two Wat Arun images have equal weight and fill the fold heavily.
- Mobile 390px screenshot shows horizontal clipping. The title, paragraphs, and image area extend past the visible right edge, so mobile needs stricter overflow control and smaller content widths.
- The current figure system uses simple max widths plus equal grid columns. It improves basic sizing, but it does not yet create the editorial rhythm requested by the article.
- Captions are present for all 13 images, but galleries still feel mechanical because the layout treats very different images as equal cells.

Screenshots saved for review:

- `tmp/design-review/current-online-edge-cli-1440x900-top.png`
- `tmp/design-review/current-online-edge-cli-390x844-top.png`

## HTML Structure

- `_layouts/life-note.html` creates `.life-note-main`, `.life-note-page`, `.life-note-header`, `.life-note-content`, and taxonomy/share footer areas.
- The layout correctly omits the author sidebar.
- The Markdown article uses a root `.life-note` wrapper and semantic `<figure>` elements.
- The contrast area currently uses a generic `.life-note-gallery.life-note-gallery--two`, so it cannot express visual hierarchy.

## SCSS Structure

- `_sass/layout/_life-notes.scss` contains both Life & Notes index styles and article styles.
- Article text is set at 18px desktop and 17px mobile.
- Figure modifiers exist for portrait, landscape, and compact images.
- `.life-note-gallery--two` and `.life-note-gallery--three` use equal columns. This is the main reason the photo sequences feel templated.

## Image Audit

| File | Size | Ratio | Type | Main subject | Crop suitability | Pairing suitability | Recommended treatment |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| `01-wat-arun-clouds.jpg` | 900x1600 | 0.562 | Portrait | Wat Arun spire against dense low cloud | Poor for crop; spire needs full height | Good with `02`, but should not be equal weight on all screens | Tall primary opener or offset pair |
| `02-wat-arun-steps.jpg` | 900x1600 | 0.562 | Portrait | Stair axis and temple peak | Poor for crop; stair symmetry matters | Good with `01` as architectural counterpoint | Slightly smaller/offset companion |
| `03-huai-khwang-street.jpg` | 900x1600 | 0.562 | Portrait | Street signs, cars, dense shopfronts | Moderate; top signs important | Better as single image | Portrait insert after street paragraph |
| `04-bangkok-traffic.jpg` | 900x1600 | 0.562 | Portrait | Traffic line and monument axis | Moderate; central road axis matters | Better as single image | Narrow portrait evidence image |
| `05-night-street.jpg` | 900x1600 | 0.562 | Portrait | Night traffic, lights, pedestrian back | Moderate | Better as single image after walking/transport paragraph | Narrower night insert |
| `06-floating-market-canal.jpg` | 900x1600 | 0.562 | Portrait | Canal water and riverside wall | Poor for hard crop; vertical water/house relationship matters | Can lead into `07`, but not side-by-side | Single portrait before old houses paragraph |
| `07-riverside-houses.jpg` | 1600x900 | 1.778 | Landscape | Stilt houses along the river | Good; landscape already balanced | Works after `06` as sequence | Wider landscape figure |
| `08-crocodile-dish.jpg` | 1600x900 | 1.778 | Landscape | Crocodile dish close-up, strong horizontal body | Poor for equal crop; head/tail span needs width | Weak equal pair with `09` because scale and ratio differ | Smaller detail/turning-point image |
| `09-riverside-mall.jpg` | 900x1600 | 0.562 | Portrait | Bright mall interior, ceiling and vertical space | Poor for crop; space depends on height | Weak equal pair with `08`; should be scene image | Larger environment image in contrast section |
| `10-shooting-target.jpg` | 900x1600 | 0.562 | Portrait | Target paper | Good for smaller display | Should stand alone | Compact figure |
| `11-seafood.jpg` | 900x1600 | 0.562 | Portrait | Seafood plate close-up | Moderate | Good in food group | Food group primary or side image |
| `12-boat-noodles.jpg` | 900x1600 | 0.562 | Portrait | Noodle bowl | Moderate | Good in food group | Food group side image |
| `13-long-fries.jpg` | 900x1600 | 0.562 | Portrait | Long fries box | Moderate | Good in food group, has humorous verticality | Food group side image |

## Why The Crocodile/Mall Pair Fails

- The two images have opposite orientations: `08` is a 16:9 food/detail close-up, while `09` is a 9:16 interior/space image.
- Their subjects operate at different scales: the crocodile image is a strong foreground object; the mall image is an environment with depth, ceiling, and floor.
- Equal-width grid gives the close-up too much force and makes the mall scene feel cramped.
- If forced into equal-height crops, one image would lose the crocodile body/head span or the mall's vertical spatial drama.
- Captions have different narrative roles: `08` is the reversal/detail, `09` is the setting. They need visual hierarchy and a shared weak heading, not equal cells.
- The better narrative order is environment first, detail second: the mall establishes the other side of the river, then the crocodile dish delivers the comic turn.
