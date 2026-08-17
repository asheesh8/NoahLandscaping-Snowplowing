# Noah's Landscaping & Snowplowing — Brand

## The idea: two seasons, one crew

Noah runs two businesses out of one truck. April to October it's mowing, beds, mulch and
cleanups. November to March it's plowing, shoveling and sanding. Most landscapers hide the
winter half or bolt it on as a footnote. For Noah it's half the year and half the reviews —
so it becomes the organizing idea of the whole site.

The signature interaction is a **season switch** that transforms the entire page: palette,
photography, service list, and copy. Nobody else in the category does this, and it's not
decoration — it's literally how the business works.

## Positioning

**He shows up.** That's the whole thing.

Of the 39 written reviews, **12 are explicitly "he showed up when nobody else would"**
stories — called on a Sunday, out of service area, in a bind, short notice after a storm,
other companies wouldn't even quote the job. That is the durable differentiator, not
"quality workmanship" (everyone claims it) and not price.

Competitor note: Black Sheep Landscaping (Essex, Chittenden County) is adjacent and runs a
restrained bone-and-black editorial look. Noah's must not resemble it. Where they are light,
quiet and abstract, Noah's is **dark, field-first and physical** — real trucks, real snow,
real mud.

## Voice

Plain Vermont. Short declaratives. No agency language, no "solutions," no "passionate about."
Borrow the customers' own words — "in a bind," "fit me in," "showed up," "got it done."

- **Say:** "Called on a Sunday. Mowed by Tuesday."
- **Never say:** "Delivering premium outdoor living experiences."

## Palette

Every colour is pulled from the actual photographs, not invented.

| Token | Hex | Where it comes from |
|---|---|---|
| `--ink` | `#0C100E` | wet grass at night |
| `--ink-2` | `#141A17` | raised surfaces |
| `--paper` | `#F1EFE6` | Vermont bone, primary text |
| `--hiviz` | `#C8F250` | the crew's actual hi-vis shirts (photos 017, 077) |
| `--amber` | `#F2A03D` | plow work-lights (photos 011, 044) |
| `--snow` | `#DCE7EF` | cold blue-white, winter accent |
| `--moss` | `#3E5641` | deep green mid-tone |
| `--stone` | `#8C8A7E` | secondary text, rules |

**Green season** leads with `--hiviz` on `--ink`.
**White season** swaps to `--snow` + `--amber` on a colder `--ink-blue`.

## Type

System stacks only — no CDN, no external font requests (keeps it fast and self-contained).

- **Display:** system sans at weight 800, letter-spacing `-0.04em`, very large. Editorial scale does the work.
- **Labels/eyebrows:** system monospace, uppercase, letter-spacing `0.18em`.

## Rules

1. **Every photograph is real.** 177 of Noah's own job photos. Never generate fake lawns or
   fake before/afters — in this trade the real work *is* the credential, and a fabricated
   result is both a legal risk and a worse sell.
2. **Every review is verbatim.** Pulled from the scrape, injected at build time from
   `reviews.json` so no quote can drift from what the customer actually wrote.
3. **No text baked into photographs.** The nine images with "Before/After" burned into the
   pixels are excluded from the site.
4. Two motion patterns maximum per section. Restraint reads as expensive.
5. Everything respects `prefers-reduced-motion`.
