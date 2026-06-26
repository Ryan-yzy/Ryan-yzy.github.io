# Life & Notes Guide

This guide is for maintaining the Life & Notes section of the site. It is not a published page.

## New article workflow

1. Create a Markdown file in `_posts` named `YYYY-MM-DD-slug.md`.
2. Add `life-notes` as the first category.
3. Add one subcategory: `travel`, `daily-life`, or `reading`.
4. Put images under `images/life-notes/year/article-name/`.
5. Fill in `title`, `date`, `excerpt`, `header.teaser`, and `tags`.
6. Use `layout: life-note` and set `author_profile: false`.
7. Run `bundle exec jekyll build` locally before publishing.
8. Commit, push, and open a pull request.

## Front matter templates

### Travel

```yaml
---
title: "Article title"
date: YYYY-MM-DD
layout: life-note
categories:
  - life-notes
  - travel
tags:
  - travel
excerpt: "A short summary for article lists."
author_profile: false
reading_minutes: 3
read_time: false
share: true
related: false
header:
  teaser: life-notes/YYYY/slug/cover.jpg
---
```

### Daily Life

```yaml
---
title: "Article title"
date: YYYY-MM-DD
layout: life-note
categories:
  - life-notes
  - daily-life
tags:
  - daily life
excerpt: "A short summary for article lists."
author_profile: false
reading_minutes: 3
read_time: false
share: true
related: false
header:
  teaser: life-notes/YYYY/slug/cover.jpg
---
```

### Reading

```yaml
---
title: "Article title"
date: YYYY-MM-DD
layout: life-note
categories:
  - life-notes
  - reading
tags:
  - reading
excerpt: "A short summary for article lists."
author_profile: false
reading_minutes: 3
read_time: false
share: true
related: false
header:
  teaser: life-notes/YYYY/slug/cover.jpg
---
```

## Image guidelines

- Prefer JPG or WebP.
- Keep each image reasonably small while preserving clarity.
- Use stable English file names.
- Do not use spaces in file names.
- Do not use Chinese paths.
- Do not use local absolute paths.
- Add meaningful alt text for each image.
- Add the actual pixel `width` and `height` for each image.
- Do not publish IDs, phone numbers, addresses, or other private details.
- For Chinese articles, set `reading_minutes` manually instead of relying on the default `number_of_words` reading-time estimate. A practical estimate is about 400 visible Chinese characters per minute, rounded up.
- The first above-the-fold article image should use `loading="eager"` and `fetchpriority="high"`.
- Every later article image should use `loading="lazy"`.
- Alt text should describe the image content. Captions should explain the image's relationship to the article.
- Standalone portrait photos should use the narrower portrait style so 9:16 images do not dominate the reading flow.
- Two related portrait photos should usually sit side by side, including on phones when the captions remain readable.
- Three or more related portrait photos should sit side by side on desktop and become a horizontal, scroll-snapping photo strip on phones.
- Do not crop documentary travel photos just to shorten a page. Preserve the full image ratio and use sizing or horizontal scrolling instead.

Use site-root image paths with the reusable figure include:

```html
{% include life-note/figure.html src="/images/life-notes/YYYY/slug/photo.jpg" alt="Alt text" caption="Caption text." figure_class="life-note-figure life-note-figure--portrait" width="900" height="1600" loading="lazy" %}
```

Use `life-note-figure--portrait` for ordinary vertical photos, `life-note-figure--landscape` for horizontal images, and `life-note-figure--compact` for small informational images such as tickets, signs, receipts, or target sheets.

Use a two-image gallery only when the two images have a similar visual role. For two portrait photos, prefer keeping them side by side instead of stacking them into a long vertical run. For a travel opener, prefer the Wat Arun-style offset pair:

```html
<div class="life-note-gallery life-note-gallery--wat" role="group" aria-label="Opening image pair">
  {% include life-note/figure.html src="/images/life-notes/YYYY/slug/photo-01.jpg" alt="Alt text" caption="Caption text." figure_class="life-note-figure life-note-figure--portrait life-note-figure--wat-clouds" width="900" height="1600" loading="eager" fetchpriority="high" %}
  {% include life-note/figure.html src="/images/life-notes/YYYY/slug/photo-02.jpg" alt="Alt text" caption="Caption text." figure_class="life-note-figure life-note-figure--portrait life-note-figure--wat-steps" width="900" height="1600" loading="lazy" %}
</div>
```

For contrast pairs with different aspect ratios or different narrative roles, do not use an equal two-column gallery. Use a contrast section with a larger scene image and a smaller detail image:

```html
<section class="life-note-contrast" aria-labelledby="contrast-title">
  <p id="contrast-title" class="life-note-contrast__eyebrow">Shared label</p>
  <div class="life-note-contrast__layout">
    {% include life-note/figure.html src="/images/life-notes/YYYY/slug/scene.jpg" alt="Alt text" caption="Scene caption." figure_class="life-note-figure life-note-contrast__scene" width="900" height="1600" loading="lazy" %}
    {% include life-note/figure.html src="/images/life-notes/YYYY/slug/detail.jpg" alt="Alt text" caption="Detail caption." figure_class="life-note-figure life-note-contrast__detail" width="1600" height="900" loading="lazy" %}
  </div>
</section>
```

Use a three-image portrait gallery for compact groups such as food. It displays as equal columns on desktop and as a keyboard-focusable horizontal photo strip on phones:

```html
<div class="life-note-gallery life-note-gallery--food" role="group" aria-label="Food photos, horizontally scrollable" tabindex="0">
  {% include life-note/figure.html src="/images/life-notes/YYYY/slug/photo-01.jpg" alt="Alt text" caption="Caption text." figure_class="life-note-figure life-note-figure--portrait life-note-figure--food-main" width="900" height="1600" loading="lazy" %}
  {% include life-note/figure.html src="/images/life-notes/YYYY/slug/photo-02.jpg" alt="Alt text" caption="Caption text." figure_class="life-note-figure life-note-figure--portrait life-note-figure--food-side-a" width="900" height="1600" loading="lazy" %}
  {% include life-note/figure.html src="/images/life-notes/YYYY/slug/photo-03.jpg" alt="Alt text" caption="Caption text." figure_class="life-note-figure life-note-figure--portrait life-note-figure--food-side-b" width="900" height="1600" loading="lazy" %}
</div>
```

Avoid long runs of full-width standalone images. Put images near the paragraph they explain, and group related images when the relationship is clear.

## Publishing workflow

```text
Markdown original
→ GitHub Pages version
→ Codex WeChat conversion
→ WeChat preview and publishing
```

The personal homepage is the permanent original. The WeChat article is the distribution version.
