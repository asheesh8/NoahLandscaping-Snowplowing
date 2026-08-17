# The mark — the Green Mountains, mowed

Vermont is the Green Mountain State. Noah mows Vermont. So the mark is a mountain range
cut into **mowing stripes** — alternating light and dark bands, exactly the pattern a
zero-turn leaves on a lawn. One idea doing two jobs: it reads as mountains at a glance and
as a mowed lawn a half-second later.

Three peaks with deep valleys, so it stays a *range* and never collapses into a single
pyramid at small sizes. The first draft had shallow valleys and read as a pyramid — the
notches were deepened until the silhouette survives at 16px.

## Files — `media/brand/`

| File | Use |
|---|---|
| `mark.svg` | Primary compact mark. Nav, avatars, anywhere square. |
| `mark-full.svg` | Mower in the foreground, range behind. Large format — invoices, truck door, print. |
| `lockup.svg` | Horizontal: mark + NOAH'S + descriptor. Letterhead, email signature. |
| `badge.svg` | Circular stamp with the full name arced around. Truck decal, hats, footer. |
| `favicon.svg` | Two-peak reduction with heavier bands. |

## How the colour works

Everything is drawn in `currentColor`, so a mark inherits whatever colour its parent has —
which means the logo automatically picks up the right accent in all four theme/season
states with no separate files:

| | dark | light |
|---|---|---|
| green season | `#C8F250` | `#3B650F` |
| white season | `#DCE7EF` | `#17527B` |

**Two gotchas, both already handled:**

1. `currentColor` does **not** work through `<img src="mark.svg">` — an SVG loaded that way
   is an isolated document and falls back to black. The marks must be **inlined**.
   `build.py` injects them at build time from these files, so there's still one source of
   truth.
2. Favicons can't use `currentColor` either. The favicon is generated separately in
   `build.py` with a literal `#5E9E1A` — a mid-green that stays legible on both light and
   dark browser tab bars.

Every `clipPath` id is namespaced (`clip-mark`, `clip-badge`, …) so multiple marks can sit
on the same page without their clip paths colliding.

## Rules

1. **Never re-colour the stripes individually.** The alternation is the whole idea; a
   flat-filled version is just a mountain.
2. **Minimum size 16px** for `favicon.svg`, 24px for `mark.svg`. Below that use a solid
   silhouette instead — the stripes turn to mud.
3. **Don't add an outline.** The mark works as positive space only.
4. `mark-full.svg` needs room. Below ~180px wide the mower stops reading — switch to `mark.svg`.
5. The mower always faces **right**, into the range. He's heading toward the work.

## Proof sheet

`brand/logo-proof.html` renders every variant at several sizes in both themes. Open it
directly; it isn't linked from the site.
