# Noah's — Seedance 2.0 image-to-video shot list

---

# ★★ v3 — natural pacing + drone liftoff (USE THIS)

**Source:** same as v2 — `video_inputs/RERUN_source_frame0_16x9.png` (upscale first)
**Settings:** 10s, highest resolution.

```
Single continuous shot, no cuts. Everything happens at natural real-time human speed —
unhurried and deliberate, never rushed or sped up.

0-3s: The man in the grey hoodie walks up to the red zero-turn mower at a relaxed,
ordinary walking pace, boots pressing into the grass with each step.

3-5s: He steps up onto the mower slowly and deliberately, lowers himself into the seat,
takes a moment to settle, pulls his ear defenders down over his ears without hurrying,
then rests both hands on the control levers.

5-6s: The engine engages and the mower begins to roll forward, moving away from the
camera, deeper into the scene, cutting a fresh stripe into the grass behind it.

5-10s: The camera lifts off the ground vertically like a drone taking off — climbing
straight up in a smooth continuous ascent while tilting down to look at the lawn,
following the mower from above and behind as it drives away, revealing the full pattern
of alternating light and dark mowing stripes across the property.

The mower always travels forward, away from the camera. It never reverses, never backs
up, and never drives toward the camera.

Throughout: cumulus clouds drift steadily across the sky. Wind moves continuously through
the trees and shrubs, branches swaying and leaves fluttering. The open grass ripples in
visible gusts. Bright midday summer sun, crisp natural shadows.

Photoreal, stable geometry, consistent lighting. No cuts, no scene changes, no time
compression, no additional people, no extra machinery, no text or logos, no morphing of
the mower or houses, no warping of the man's face or hands.
```

### v2 diagnosis
| Complaint | What actually happened |
|---|---|
| "he walks up too fast / turns it on too fast" | Walk + mount + seated + ear defenders all done by **t=2.4s**, then 7s of him sitting still |
| "don't make him go back" | He drives **toward** the camera while the camera retreats — reads as backing away from the house. Fixed by making him drive *away* from camera. |
| "make it more natural" | Added explicit real-time pacing language and beat-by-beat physical actions |
| POV should take off like a drone | v2 was a conventional crane. v3 says "lifts off the ground vertically like a drone taking off." |
| Still 4:3 | See note below — output was **1112×834 on both runs** |

### The aspect ratio problem
Both generations came out **exactly 1112×834**, regardless of the 16:9 source. The model
is ignoring input aspect, so it's a generation setting on the Higgsfield side, not
something the prompt can fix. If there's no 16:9 option on your tier: generate as-is,
then crop to 16:9 and upscale — the action sits dead center, so you lose nothing.

```bash
ffmpeg -i in.mp4 -vf "crop=iw:iw*9/16" -c:a copy out_16x9.mp4
```

### If the drone liftoff still misbehaves
Replace the 5-10s beat with the less ambitious version — same stripe reveal, far less
for the model to invent:
`5-10s: The camera rises steadily to a high three-quarter view looking down across the lawn, following the mower as it drives away.`

---

# v2 — mower mount → aerial reveal (superseded)

**Source image:** `video_inputs/RERUN_source_frame0_16x9.png`
(frame 0 of the first generation, cropped to 16:9 — keeps the composition that worked)

**Settings:** 16:9 · 10s · highest resolution available
**Order:** Higgsfield upscale the source → Seedance → Higgsfield video-upscale the output

```
Single continuous shot, no cuts.

0-3s: The man in the grey hoodie takes the last steps to the red zero-turn mower and
climbs into the seat, settling both hands onto the control levers.

3-5s: The mower pulls forward and begins cutting, moving steadily across the lawn and
laying a fresh mowing stripe behind it.

5-10s: The camera cranes upward and pulls back at the same time, rising smoothly into a
high overhead aerial view looking down on the property, revealing the full pattern of
alternating light and dark mowing stripes with the mower still cutting a clean line below.

Throughout the entire shot: cumulus clouds drift steadily left to right across the sky.
Wind moves continuously through the trees and shrubs, leaves fluttering and branches
swaying. The open grass ripples in visible gusts. Bright midday summer sun, crisp
natural shadows.

Photoreal, consistent lighting, stable geometry throughout. No cuts, no scene changes,
no additional people, no extra vehicles or machinery, no text or logos, no morphing of
the mower or the houses, no warping of the man's face or hands.
```

### What this fixes from v1
| v1 problem | Measured | Fix in v2 |
|---|---|---|
| Camera pushed **in**, ended on an awkward tight crop | — | Explicit "cranes upward and pulls back" |
| He mounts but **never mows** | mower static all 10s | Beat at 3-5s makes the mower cut |
| Background dead — that's the "not real" feeling | sky changed **9.6/255** over 9.4s | Cloud drift + wind + grass gusts called out as *throughout*, with direction |
| 1112×834, **4:3**, too small for a hero | — | Lock 16:9, upscale source and output |

---


Source crops live in `video_inputs/` (already 16:9). Order of operations matters:
**Higgsfield upscale → then Seedance i2v.** Starting from a clean source is the single
biggest quality lever; Seedance will happily amplify phone-sensor noise into crawling artifacts.

Target: ~5s, loopable, muted, 1280×720+ — matching the hero pattern on the reference build.

---

## 1. HERO — `video_inputs/011_night-plow_16x9.jpg`
**Upscale first (source is 1536×864 after crop).**

```
Slow cinematic push-in toward the plow truck. Snow continues falling in fine diagonal
streaks through the headlight beams, catching the light as it passes. Amber cab lights
and the blue LED bar flicker almost imperceptibly. Faint drifting snow haze across the
foreground. The truck and plow remain completely static and structurally unchanged.
Handheld micro-drift, very subtle. Cold blue-and-amber night palette, heavy film grain.
No text, no logos changing, no morphing of the vehicle, no people entering frame.
```
Why: the falling snow is already streaking in the still, so the model has an obvious,
physically correct motion vector. This is the most cinematic frame in the whole set.

---

## 2. SUMMER HERO — `video_inputs/140_mower-stripes_16x9.jpg`
No upscale needed (4284×2410).

```
Locked-off wide shot. The zero-turn mower drives slowly left to right along the lawn
edge, cutting a clean stripe. Grass blades ripple gently in a light breeze. Cumulus
clouds drift slowly across the sky. Soft summer sunlight, gentle lens breathing.
Everything else holds still. Photoreal, no style change, no text, no morphing,
no extra machinery appearing.
```
Why: one clear subject moving on a clean vector, plus two free ambient layers
(grass, clouds). Very low failure risk — make this the safe hero.

---

## 3. TEXTURE LOOP — `video_inputs/091_mulch-fork_16x9.jpg`
No upscale needed (4284×2410).

```
Extreme close-up, slow macro push. The pitchfork sinks into the mulch pile and lifts,
dark shredded bark tumbling and cascading down the slope in loose clumps. Fine dust
motes drift through a shaft of daylight. Shallow depth of field, rich earthy blacks
and browns. The hand grips the handle naturally — no extra fingers, no morphing.
Photoreal, no text.
```
Why: this is the "most satisfying physical moment" slot. It's also the best real
texture source in the set — the 100% crop is razor-sharp shredded bark, which
doubles as a section background at low opacity.

---

## 4. EDITORIAL / ABOUT SECTION — `video_inputs/069_field-storm_16x9.jpg`
No upscale needed (3024×1701).

```
Static wide landscape. Heavy storm clouds roll slowly across the mountain ridge.
The tiny mower in hi-vis creeps almost imperceptibly across the striped field.
Wind moves through the treeline and tall grass in the foreground. Muted overcast
Vermont palette, desaturated greens and greys. Very slow, patient, contemplative.
No text, no camera move, no zoom.
```
Why: closest match to the restrained bone-and-black editorial tone. Great behind
an "about / coverage area" section where the copy needs to stay readable.

---

## 5. WINTER B-ROLL — `video_inputs/044_plow-bank_16x9.jpg`
**Upscale first (1536×864).**

```
Slow lateral drift to the right. Snow falls steadily through the amber work lights.
Loose snow spills and tumbles off the top of the plowed bank. The BOSS plow blade
stays perfectly static and unchanged. Sodium-orange light on packed snow, deep blue
shadows, heavy grain. No text, no vehicle morphing, no people.
```

---

## Do NOT feed these to i2v
- `009` / `048` (blue Victorian, 960×1280) — beautiful, but too small; use as **stills** after upscaling.
- `077` (mulch forking, 800×596) and `035` (mower, 638×800) — content is great, resolution isn't. Stills only, heavy upscale.
- Anything with baked-in "Before / After" text (`001`, `004`, `020`, `024`, `040`, `081`, `120`, `151`, `175`) — text will smear under i2v.

---

## Higgsfield upscale queue (priority order)

| File | Current | Why |
|---|---|---|
| `photos/011.jpg` | 1536×2048 | Hero. Must be 4K for fullscreen. |
| `photos/044.jpg` | 1536×2048 | Winter b-roll + winter section still. |
| `photos/009.jpg` | 960×1280 | Best "after" in the set — the mulch-bed money shot. |
| `photos/048.jpg` | 960×1280 | Same house, second angle. Pairs with 009. |
| `photos/000.jpg` | 1179×664 | The only real crew + branded truck shot. Team section. |
| `photos/077.jpg` | 800×596 | Crew physically working, branded hi-vis. Great, tiny. |
| `photos/063.jpg` | 1536×2048 | Third plow angle if you want a winter triptych. |
| `photos/017.jpg` | 1170×1680 | Chainsaw / autumn — covers tree work. |
| `photos/035.jpg` | 638×800 | Clean mower portrait. |
| `photos/176.jpg` | 1170×1700 | Higher-res twin of `174`; use this one, not 174. |

**Already 4K+, do not waste credits:** `091`, `140`, `032` (4284×5712) and
`069`, `100`, `132`, `116`, `147` (3024×4032).
