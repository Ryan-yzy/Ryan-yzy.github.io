# Life & Notes Guide

This guide is for maintaining the Life & Notes section of the site. It is not a published page.

## New article workflow

1. Create a Markdown file in `_posts` named `YYYY-MM-DD-slug.md`.
2. Add `life-notes` as the first category.
3. Add one subcategory: `travel`, `daily-life`, `research-life`, or `reading`.
4. Put images under `images/life-notes/year/article-name/`.
5. Fill in `title`, `date`, `excerpt`, `header.teaser`, and `tags`.
6. Run `bundle exec jekyll build` locally before publishing.
7. Commit, push, and open a pull request.

## Front matter templates

### Travel

```yaml
---
title: "Article title"
date: YYYY-MM-DD
categories:
  - life-notes
  - travel
tags:
  - travel
excerpt: "A short summary for article lists."
author_profile: true
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
categories:
  - life-notes
  - daily-life
tags:
  - daily life
excerpt: "A short summary for article lists."
author_profile: true
read_time: true
share: true
related: false
header:
  teaser: life-notes/YYYY/slug/cover.jpg
---
```

### Research Life

```yaml
---
title: "Article title"
date: YYYY-MM-DD
categories:
  - life-notes
  - research-life
tags:
  - research life
excerpt: "A short summary for article lists."
author_profile: true
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
categories:
  - life-notes
  - reading
tags:
  - reading
excerpt: "A short summary for article lists."
author_profile: true
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

```markdown
![Alt text](/images/life-notes/YYYY/slug/photo.jpg)

*Caption text.*
```

## Publishing workflow

```text
Markdown original
→ GitHub Pages version
→ Codex WeChat conversion
→ WeChat preview and publishing
```

The personal homepage is the permanent original. The WeChat article is the distribution version.
