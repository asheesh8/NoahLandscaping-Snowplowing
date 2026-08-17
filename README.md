# Noah's Landscaping & Snowplowing

Brand, website and operations CRM for Noah's Landscaping & Snowplowing LLC — Fairfax, Vermont.

```bash
cd site && python3 build.py && python3 -m http.server 8823
```

- Public site → `http://localhost:8823`
- CRM → `http://localhost:8823/admin/` *(no authentication yet — see below)*

## What's here

| Path | |
|---|---|
| `site/` | The website. Static, 5 pages, no framework, no CDN. See `site/README.md`. |
| `site/admin/` | Operations CRM — pipeline, customers, schedule, invoices, reviews. |
| `site/brand/` | Positioning, palette, voice, logo system + proof sheet. |
| `site/media/` | Hero video and the 18 web-optimised job photos actually used. |
| `reviews.json` | All 47 Google reviews, scraped. The site injects these verbatim at build time. |
| `photos.json`, `photo_urls.txt` | Manifest of all 177 scraped photos with source URLs and dimensions. |
| `download_photos.sh` | Re-downloads the full 424MB original photo set. |
| `seedance_prompts.md` | Image-to-video shot list and prompts used for the hero. |

## Not in the repo

`photos/` (424MB originals), `final/` and `video_inputs/` (video working files) are
gitignored. Run `./download_photos.sh` to restore the originals from `photo_urls.txt` —
though Google's CDN URLs are not permanent, so the local copies are the durable ones.

The shipped 1080p hero video **is** tracked, in `site/media/hero/`.

## Deploying (Vercel)

`vercel.json` sets `outputDirectory: "site"` — the site lives in `site/`, not the repo
root, so without it Vercel serves the root (which has no `index.html`) and returns
**404: NOT_FOUND**. No build step, no install step; it's plain static files.

`/admin/*` is served with `X-Robots-Tag: noindex`, and `/assets/*` + `/media/*` get
immutable long-cache headers (CSS and JS are already content-hashed by `build.py`).

**To block the CRM from the public deploy entirely**, add this to `vercel.json`:

```json
"routes": [{ "src": "/admin/(.*)", "status": 404 }]
```

Or put it behind Vercel's Password Protection / Deployment Protection in project settings.

## Before this goes live

1. **The CRM has no login.** Anyone with the URL sees every customer and invoice. Don't
   deploy `site/admin/` publicly until it's behind auth.
2. **The contact form doesn't deliver mail** until an endpoint is set — see `site/README.md`.
3. **Coverage towns and service lists need Noah's confirmation.** Only Fairfax and Fletcher
   are evidenced by the review text; the rest are marked "ask about your address" on the
   map but the town list is still a guess.
4. `reviews.json` contains real customer names and review text scraped from a public Google
   profile. It's already public data and the site displays it by design, but note that
   committing it here redistributes it.
