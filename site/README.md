# Noah's Landscaping & Snowplowing — site

Static, 6 pages. No framework, no CDN, no external font or script requests.

```bash
cd site && python3 build.py && python3 -m http.server 8823
```

## Structure

```
site/
├── build.py                 ← generator. run after ANY template/asset edit
├── templates/
│   ├── _base.html           ← shared shell: nav, season switch, footer
│   ├── index.html  services.html  work.html  about.html  reviews.html  contact.html
├── assets/app.css  assets/app.js
├── brand/                   ← positioning, palette, voice, logo docs + proof sheet
├── admin/                   ← CRM single-page app (no login yet)
├── media/brand/             ← logo system (mark, lockup, badge, favicon)
├── media/hero/              ← hero video + poster
├── media/work/              ← 18 optimised photos (webp, 2 sizes each)
└── *.html                   ← GENERATED. do not edit by hand
```

Edit `templates/`, run `python3 build.py`. Editing the root `.html` files directly gets
overwritten on the next build.

## Two independent axes

| Axis | Values | Drives |
|---|---|---|
| `data-theme` | `dark` · `light` | surfaces, text, borders |
| `data-season` | `green` · `white` | accent colour, hero media, copy, service lists |

All four combinations are defined in CSS. Accent per combination:

| | dark | light |
|---|---|---|
| **green** | `#C8F250` hi-vis | `#3B650F` deep green |
| **white** | `#DCE7EF` snow | `#17527B` winter blue |

The hi-vis green is unreadable on paper, so light mode swaps to a deep green with the
same origin. `--on-accent` flips alongside it so buttons stay legible in all four states.

**Theme** defaults to `prefers-color-scheme`, then follows the OS until the user picks —
after that their choice sticks. **Season** defaults to the actual Vermont season
(Nov–Mar opens on white). Both persist in `localStorage` and are applied by an inline
script before first paint, so there's no flash.

## The Vermont map

Projected at build time from real lat/lon in `build.py` — `VT_BORDER` is a 31-point state
outline, `TOWNS` carries coordinates and a coverage status. Simple equirectangular
projection with a `cos(lat)` correction so the state isn't stretched.

Three pin states, and the distinction is deliberate:

- **base** — Fairfax. Noah's actual address.
- **core** — Fletcher. Named in customer reviews.
- **ask** — everything else. Plausible, *not confirmed*. Labels hidden until hover so the
  north-west cluster stays readable.

Dashed ring is a ~20-mile working radius around Fairfax. Pins are keyboard-focusable and
report into a live region.

To change coverage, edit `TOWNS` in `build.py` and rebuild.

## Reviews

`build.py` injects all **40 written reviews verbatim** from `../reviews.json` — nothing is
retyped, so no quote can drift from what the customer wrote. The other 7 of the 47 are
star-only with no text and are counted but not shown.

Each card carries an avatar, rating, relative date, an auto-derived season tag, a photo
chip where the reviewer attached one, and **Noah's reply** where he left one (18 do).
Filter chips switch by rating.

**The 1★ is currently shown.** `SHOW_ALL_RATINGS = False` in `build.py` hides it. It's
included because you asked for all of them, and because a visible 1★ with the owner's
reply underneath tends to read as more credible than a wall of 5s — but it's a real
business decision and Noah should make it. His reply disputes the person was ever a
customer.


## Before / after

`media/ba/` holds 8 split pairs. Noah's own before/after composites (side-by-side, with
the caption burnt into the pixels) were pulled from the Google scrape, the seam detected
by finding the lowest-variance column near centre, the caption bar cropped off, and each
half exported separately.

The comparison slider is a range input sitting invisibly over the stage — so it works
with mouse, touch **and** keyboard for free, and the arrow keys move it (shift for bigger
steps). The "before" image is width-locked to the stage so it doesn't squash as its clip
container narrows.

Sources: `media/ba/index.json` records which original each pair came from.

**Facebook and Instagram could not be scraped.** Both are behind hard login walls and I
won't log in to either. The before/afters here are Noah's own, from what he posted to
Google. If he wants the Facebook set too, the practical route is exporting them from his
own account.

## Motion

- **Click ripple** — a circle blooms at the click point and fades (~0.5s). It picks up the
  accent colour, and the media accent over full-bleed photography. Cleanup is belt-and-braces:
  `animationend` normally, plus a 900ms timeout so nothing leaks if the animation never runs
  (background tab, throttled compositor).
- **No trailing cursor.** The old lerped circle that followed the pointer is gone.
- **No scroll parallax.** Images no longer shift as you scroll; `data-par` attributes removed.
- **Kept:** scroll reveals (fade-up on enter), count-ups, and the marquee — these are entrance
  animations, not pointer or scroll-linked effects.

All of it stays off under `prefers-reduced-motion`.

## Contact form

`templates/contact.html` → validated, honeypot-protected, season-aware service pickers
(the checkbox list swaps between green and white services with the season switch).

**It does not email anyone yet.** Set an endpoint to go live — anything that accepts a
JSON POST (Formspree, Web3Forms, Netlify Forms):

```html
<!-- in templates/_base.html, before app.js -->
<script>window.NOAH_FORM_ENDPOINT = "https://formspree.io/f/xxxxxxx";</script>
```

Until that is set the form saves the lead to `localStorage` and says so plainly on screen
rather than pretending it sent. Either way the lead lands in the CRM inbox.

## Admin CRM — `admin/`

Single-page app, no framework, no build. Open `admin/index.html` **over http** (the ES
modules and `reviews.json` fetch will not work from `file://`).

| View | What it does |
|---|---|
| Dashboard | New leads, today's route, outstanding vs paid, latest enquiries |
| Pipeline | Drag-and-drop kanban — New → Contacted → Quoted → Won/Lost, with per-stage totals |
| Customers | Table → detail drawer with property notes, job history, lifetime billed |
| Schedule | Week view, season-aware (mow route vs plow route) |
| Invoices | Paid / awaiting / overdue / draft with totals |
| Reviews | The real 47 from `reviews.json`, flagging which still need a reply |
| Settings | Business details, default rates, form endpoint, CSV + JSON export, reset |

Lead detail supports notes, stage changes, quote values, and **convert to customer** —
which creates the customer record and marks the lead won.

Data lives in one `noah-crm` localStorage key, shared with the public form.
`/` focuses search, `Esc` closes the drawer.

### Two things to know before this is real

1. **There is no login.** Anyone with the URL sees everything. It must not be deployed
   publicly as-is — either keep it local, put it behind basic auth / a host-level password,
   or wait for real accounts.
2. **localStorage is per-browser, not a database.** Data does not sync between Noah's
   phone and laptop, and clearing site data wipes it. It's the right shape to demo and to
   agree the workflow — it is not yet the system of record. Use *Settings → Export backup*
   before any browser cleanup.

### Seed data is fictional — deliberately

Every customer, job and invoice in the demo is invented. Real reviewer names from the
Google scrape are **not** used as CRM records: attaching invented addresses, job prices and
invoice amounts to real named people would be fabricating records about real individuals.
The Reviews view reads the genuine scrape instead.

## Verified

- All 5 pages return 200; every local asset and internal link resolves
- No horizontal overflow at 375px or 1440px on any page
- No broken images on any page
- 227 CSS rules parse on every page
- Map geography checked numerically (St. Albans north of Fairfax, Burlington south-west,
  Fletcher east, Underhill south of Fletcher)
- Assets are content-hashed (`app.css?v=…`) so deploys don't serve stale CSS

## Still needs Noah before launch

1. **Coverage towns** — only Fairfax and Fletcher are evidenced. The other ten are
   unverified guesses. Confirm or cut them.
2. **Service lists** — inferred from reviews and photos. Roof clearing and sanding in
   particular need confirming.
3. **The 1★ decision** — see above.
4. **Hours, contract terms, insurance, licence** — not in any scraped source.

## Not built

- No authentication on the CRM (see above).
- No server. Everything is static plus localStorage; the form needs a third-party endpoint
  to actually deliver mail.
