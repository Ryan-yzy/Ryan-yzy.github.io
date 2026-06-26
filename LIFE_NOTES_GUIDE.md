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
read_time: true
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
read_time: true
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
read_time: true
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
- Do not publish IDs, phone numbers, addresses, or other private details.

Use site-root image paths in articles:

```html
<figure class="life-note-figure life-note-figure--portrait">
  <img src="/images/life-notes/YYYY/slug/photo.jpg" alt="Alt text" loading="lazy" decoding="async">
  <figcaption>Caption text.</figcaption>
</figure>
```

Use `life-note-figure--portrait` for ordinary vertical photos, `life-note-figure--landscape` for horizontal images, and `life-note-figure--compact` for small informational images such as tickets, signs, receipts, or target sheets.

Use a two-image gallery only when the two images have a similar visual role. For a travel opener, prefer the Wat Arun-style offset pair:

```html
<div class="life-note-gallery life-note-gallery--wat">
  <figure class="life-note-figure life-note-figure--portrait life-note-figure--wat-clouds">
    <img src="/images/life-notes/YYYY/slug/photo-01.jpg" alt="Alt text" loading="lazy" decoding="async">
    <figcaption>Caption text.</figcaption>
  </figure>
  <figure class="life-note-figure life-note-figure--portrait life-note-figure--wat-steps">
    <img src="/images/life-notes/YYYY/slug/photo-02.jpg" alt="Alt text" loading="lazy" decoding="async">
    <figcaption>Caption text.</figcaption>
  </figure>
</div>
```

For contrast pairs with different aspect ratios or different narrative roles, do not use an equal two-column gallery. Use a contrast section with a larger scene image and a smaller detail image:

```html
<section class="life-note-contrast" aria-labelledby="contrast-title">
  <p id="contrast-title" class="life-note-contrast__eyebrow">Shared label</p>
  <div class="life-note-contrast__layout">
    <figure class="life-note-figure life-note-contrast__scene">
      <img src="/images/life-notes/YYYY/slug/scene.jpg" alt="Alt text" loading="lazy" decoding="async">
      <figcaption>Scene caption.</figcaption>
    </figure>
    <figure class="life-note-figure life-note-contrast__detail">
      <img src="/images/life-notes/YYYY/slug/detail.jpg" alt="Alt text" loading="lazy" decoding="async">
      <figcaption>Detail caption.</figcaption>
    </figure>
  </div>
</section>
```

Use an asymmetric three-image gallery for compact groups such as food:

```html
<div class="life-note-gallery life-note-gallery--food">
  <figure class="life-note-figure life-note-figure--portrait life-note-figure--food-main">
    <img src="/images/life-notes/YYYY/slug/photo-01.jpg" alt="Alt text" loading="lazy" decoding="async">
    <figcaption>Caption text.</figcaption>
  </figure>
  <figure class="life-note-figure life-note-figure--portrait life-note-figure--food-side-a">
    <img src="/images/life-notes/YYYY/slug/photo-02.jpg" alt="Alt text" loading="lazy" decoding="async">
    <figcaption>Caption text.</figcaption>
  </figure>
  <figure class="life-note-figure life-note-figure--portrait life-note-figure--food-side-b">
    <img src="/images/life-notes/YYYY/slug/photo-03.jpg" alt="Alt text" loading="lazy" decoding="async">
    <figcaption>Caption text.</figcaption>
  </figure>
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
