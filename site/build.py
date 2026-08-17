#!/usr/bin/env python3
"""Static generator for Noah's.

Builds 5 pages from templates/ + shared partials. Reviews are injected VERBATIM
from ../reviews.json so no quote can drift from what the customer wrote on Google.
The Vermont service map is projected from real lat/lon at build time.
"""
import json, html, math, pathlib, hashlib, urllib.parse

HERE = pathlib.Path(__file__).parent
T = HERE / "templates"
DATA = json.loads((HERE.parent / "reviews.json").read_text())
REVIEWS = DATA["reviews"]

# Set False to hide the disputed 1-star review on the public site.
SHOW_ALL_RATINGS = True

# ── site map ────────────────────────────────────────────────────────────────
PAGES = [
    ("index",    "index.html",    "Twelve months of showing up",
     "Lawn care, beds and cleanups from April. Plowing and shovelling all winter. One crew, twelve months, Fairfax Vermont."),
    ("services", "services.html", "Services",
     "Mowing, beds, mulch, cleanups, plowing, shovelling and sanding across Fairfax and Franklin County, Vermont."),
    ("work",     "work.html",     "Selected work",
     "Real photographs from real jobs around Fairfax, Fletcher and the surrounding towns."),
    ("reviews",  "reviews.html",  "Reviews",
     "All 47 Google reviews for Noah's Landscaping & Snowplowing, shown verbatim. 4.9 stars."),
    ("about",    "about.html",    "About",
     "Noah Ross started mowing lawns around Fairfax, Vermont and built a five-person crew that works twelve months a year."),
    ("contact",  "contact.html",  "Contact",
     "Free estimates. Call or text (802) 735-5975. Based at 384 Fletcher Rd, Fairfax VT."),
]
NAV = [("services", "Services"), ("work", "Work"), ("about", "About"),
       ("reviews", "Reviews"), ("contact", "Contact")]

# ── Vermont service map ─────────────────────────────────────────────────────
# Simplified state boundary, real lat/lon. North = Canada line, east = Connecticut
# River, west = Lake Champlain then the New York line.
VT_BORDER = [
    (-73.35,45.01),(-71.50,45.01),(-71.58,44.80),(-71.65,44.62),(-71.78,44.40),
    (-71.90,44.30),(-72.03,44.19),(-72.10,44.05),(-72.19,43.90),(-72.28,43.70),
    (-72.32,43.55),(-72.38,43.35),(-72.40,43.20),(-72.44,43.00),(-72.46,42.86),
    (-72.46,42.73),(-73.28,42.73),(-73.28,43.00),(-73.26,43.25),(-73.25,43.50),
    (-73.28,43.62),(-73.37,43.75),(-73.40,43.90),(-73.30,44.05),(-73.32,44.20),
    (-73.30,44.35),(-73.29,44.50),(-73.32,44.62),(-73.37,44.75),(-73.35,44.85),
    (-73.30,44.95),
]
# status: base = HQ, core = named in a customer review, ask = plausible, unconfirmed
TOWNS = [
    ("Fairfax",        44.6714, -72.9753, "base", "Home base — 384 Fletcher Rd"),
    ("Fletcher",       44.7017, -72.8462, "core", "Named in customer reviews"),
    ("Cambridge",      44.6431, -72.8801, "ask",  "Ask about your address"),
    ("Georgia",        44.7217, -73.1279, "ask",  "Ask about your address"),
    ("Westford",       44.6156, -73.0090, "ask",  "Ask about your address"),
    ("Milton",         44.6389, -73.1104, "ask",  "Ask about your address"),
    ("St. Albans",     44.8109, -73.0832, "ask",  "Ask about your address"),
    ("Underhill",      44.5406, -72.8934, "ask",  "Ask about your address"),
    ("Jeffersonville", 44.6448, -72.8262, "ask",  "Ask about your address"),
    ("Jericho",        44.5039, -72.9962, "ask",  "Ask about your address"),
    ("Essex",          44.4906, -73.1093, "ask",  "Ask about your address"),
    ("Burlington",     44.4759, -73.2121, "ask",  "Ask about your address"),
]
W, H, PAD = 460, 720, 26

# favicon needs a literal colour; mid-green stays legible on light and dark tab bars
_FAV = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">'
        '<defs><clipPath id="f"><path d="M1,26 L10,9 L16,22 L22,4 L31,26 Z"/></clipPath></defs>'
        '<g clip-path="url(#f)" fill="#5E9E1A">'
        '<rect x="0" y="3" width="32" height="6"/>'
        '<rect x="0" y="9" width="32" height="6" opacity=".33"/>'
        '<rect x="0" y="15" width="32" height="6"/>'
        '<rect x="0" y="21" width="32" height="5" opacity=".33"/></g>'
        '<path d="M1,28.5 L31,28.5" stroke="#5E9E1A" stroke-width="2.6" stroke-linecap="round"/></svg>')
FAVICON = "data:image/svg+xml," + urllib.parse.quote(_FAV)

def _proj():
    lons = [p[0] for p in VT_BORDER]; lats = [p[1] for p in VT_BORDER]
    lon0, lon1, lat0, lat1 = min(lons), max(lons), min(lats), max(lats)
    k = math.cos(math.radians((lat0 + lat1) / 2))          # flatten longitude
    sx = (W - 2*PAD) / ((lon1 - lon0) * k)
    sy = (H - 2*PAD) / (lat1 - lat0)
    s = min(sx, sy)
    ox = (W - (lon1 - lon0) * k * s) / 2
    oy = (H - (lat1 - lat0) * s) / 2
    def f(lon, lat):
        return (ox + (lon - lon0) * k * s, oy + (lat1 - lat) * s)
    return f

def build_map():
    f = _proj()
    pts = [f(lon, lat) for lon, lat in VT_BORDER]
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    hq = next(t for t in TOWNS if t[3] == "base")
    hx, hy = f(hq[2], hq[1])
    # ~20 mile working radius, projected
    r = abs(f(hq[2] + 20/(69*math.cos(math.radians(hq[1]))), hq[1])[0] - hx)

    pins = []
    for i, (name, lat, lon, status, note) in enumerate(TOWNS):
        x, y = f(lon, lat)
        pins.append(
            f'<g class="pin pin--{status}" data-town="{html.escape(name)}" '
            f'data-note="{html.escape(note)}" tabindex="0" role="button" '
            f'aria-label="{html.escape(name)} — {html.escape(note)}" '
            f'style="--d:{i*45}ms" transform="translate({x:.1f},{y:.1f})">'
            f'<circle class="pin-halo" r="15"/>'
            f'<circle class="pin-dot" r="{6 if status=="base" else 4.5}"/>'
            f'<text class="pin-label" x="{-11 if x > W*0.55 else 11}" y="4" '
            f'text-anchor="{"end" if x > W*0.55 else "start"}">{html.escape(name)}</text>'
            f"</g>"
        )
    return f"""<svg class="vtmap" viewBox="0 0 {W} {H}" role="img" aria-label="Map of Vermont showing Noah's service area">
  <defs><filter id="mglow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <path class="vt-shadow" d="{d}"/>
  <path class="vt-fill" d="{d}"/>
  <circle class="vt-radius" cx="{hx:.1f}" cy="{hy:.1f}" r="{r:.1f}"/>
  <path class="vt-stroke" d="{d}"/>
  {''.join(pins)}
</svg>"""

# ── before / after ──────────────────────────────────────────────────────────
def build_ba(limit=None):
    """Split composites live in media/ba/. Left half = before, right = after."""
    data = json.loads((HERE / "media/ba/index.json").read_text())
    if limit: data = data[:limit]
    out = []
    for i, j in enumerate(data):
        out.append(
            f'<figure class="ba rv" data-ba tabindex="0" aria-label="Before and after: {html.escape(j["caption"])}. '
            f'Drag or use arrow keys to compare.">'
            f'<div class="ba-stage" style="aspect-ratio:{j["w"]}/{j["h"]}">'
            f'<img class="ba-after"  src="media/ba/{j["slug"]}-after.webp"  alt="After — {html.escape(j["caption"])}" loading="lazy">'
            f'<div class="ba-clip"><img class="ba-before" src="media/ba/{j["slug"]}-before.webp" alt="Before — {html.escape(j["caption"])}" loading="lazy"></div>'
            f'<span class="ba-tag ba-tag-b">Before</span><span class="ba-tag ba-tag-a">After</span>'
            f'<span class="ba-handle" aria-hidden="true"><i></i></span>'
            f'<input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Reveal amount">'
            f'</div>'
            f'<figcaption>{html.escape(j["caption"])}</figcaption>'
            f'</figure>')
    return "\n".join(out)

# ── reviews ─────────────────────────────────────────────────────────────────
def short_name(full):
    p = [x for x in full.strip().split() if x]
    return p[0] if len(p) == 1 else f"{p[0]} {p[-1][0]}."

def initials(full):
    p = [x for x in full.strip().split() if x]
    return (p[0][0] + (p[-1][0] if len(p) > 1 else "")).upper()

SEASON_WORDS = ("plow", "snow", "shovel", "winter", "storm", "ice", "sand")
def tag_of(r):
    t = (r["text"] or "").lower()
    return "White season" if any(w in t for w in SEASON_WORDS) else "Green season"

def review_card(r, featured=False):
    stars = ("★" * int(r["rating"])) + ("☆" * (5 - int(r["rating"])))
    body = html.escape(r["text"]).replace("\n", "<br>")
    owner = ""
    if r["owner_response"]:
        owner = (
            '<div class="rev-reply"><span class="rev-reply-t">Noah replied'
            f'{" · " + html.escape(r["owner_response_date"]) if r["owner_response_date"] else ""}</span>'
            f'<p>{html.escape(r["owner_response"])}</p></div>'
        )
    photo = '<span class="rev-chip">photo</span>' if r["review_photos"] else ""
    return (
        f'<article class="rev rv" data-rating="{int(r["rating"])}" data-tag="{tag_of(r)}">'
        f'<header class="rev-top">'
        f'<span class="rev-av" aria-hidden="true">{html.escape(initials(r["author"]))}</span>'
        f'<span class="rev-id"><b>{html.escape(short_name(r["author"]))}</b>'
        f'<span class="rev-meta">{html.escape(r["date_relative"])}</span></span>'
        f'<span class="rev-stars" aria-label="{int(r["rating"])} out of 5">{stars}</span>'
        f"</header>"
        f'<blockquote class="rev-body{" is-long" if len(r["text"]) > 300 else ""}">{body}</blockquote>'
        + ('<button class="rev-more" type="button">Read more</button>' if len(r["text"]) > 300 else "")
        + f'<footer class="rev-foot"><span class="rev-chip">{tag_of(r)}</span>{photo}</footer>'
        + f"{owner}</article>"
    )

FEATURED = ["Scott Redfield","Kathy Jochim","Michael Pelkey","Alicia Finley",
            "Mary Beth Thomas","Becky Claytor"]

def build_reviews():
    pool = [r for r in REVIEWS if r["text"]]
    if not SHOW_ALL_RATINGS:
        pool = [r for r in pool if r["rating"] >= 4]
    by = {r["author"]: r for r in pool}
    feat = "\n".join(review_card(by[n], True) for n in FEATURED if n in by)
    every = "\n".join(review_card(r) for r in pool)
    silent = len([r for r in REVIEWS if not r["text"]])
    dist = {s: sum(1 for r in REVIEWS if int(r["rating"]) == s) for s in (5,4,3,2,1)}
    bars = "".join(
        f'<div class="dist-row"><span class="dist-k">{s}★</span>'
        f'<span class="dist-bar"><i style="--w:{(dist[s]/len(REVIEWS)*100):.1f}%"></i></span>'
        f'<span class="dist-v">{dist[s]}</span></div>' for s in (5,4,3,2,1))
    return feat, every, bars, len(pool), silent

def build_marquee():
    frags = [ (r["text"] or "").strip().rstrip(".")
              for r in REVIEWS if r["rating"] == 5 and 28 <= len(r["text"] or "") <= 84 ][:10]
    m = "".join(f"<span><b>★</b> {html.escape(f)}</span>" for f in frags)
    return m + m

# ── assemble ────────────────────────────────────────────────────────────────
def main():
    base = (T / "_base.html").read_text()
    # content hash so browsers pick up asset changes immediately
    def ver(rel):
        return hashlib.sha1((HERE / rel).read_bytes()).hexdigest()[:8]
    css_v, js_v = ver("assets/app.css"), ver("assets/app.js")
    feat, every, bars, shown, silent = build_reviews()
    brand = lambda n, cls: (HERE / "media/brand" / n).read_text() \
        .replace("<svg ", f'<svg class="{cls}" ', 1)
    tokens = {
        "MARK": brand("mark.svg", "brand-mark"),
        "BADGE": brand("badge.svg", "foot-badge"),
        "FAVICON": FAVICON,
        "MAP": build_map(),
        "BA_ALL": build_ba(),
        "BA_SOME": build_ba(4),
        "MARQUEE": build_marquee(),
        "REVIEWS_FEATURED": feat,
        "REVIEWS_ALL": every,
        "REVIEWS_DIST": bars,
        "REVIEWS_SHOWN": str(shown),
        "REVIEWS_SILENT": str(silent),
        "REVIEWS_TOTAL": str(len(REVIEWS)),
    }
    for slug, fname, title, desc in PAGES:
        body = (T / f"{slug}.html").read_text()
        nav = "".join(
            '<a href="{}.html"{}>{}</a>'.format(
                s, ' class="is-on"' if s == slug else "", label)
            for s, label in NAV)
        page = (base
                .replace("{{TITLE}}", html.escape(title))
                .replace("{{DESC}}", html.escape(desc))
                .replace("{{NAV}}", nav)
                .replace("{{SLUG}}", slug)
                .replace("{{CSS_V}}", css_v)
                .replace("{{JS_V}}", js_v)
                .replace("{{BODY}}", body))
        for k, v in tokens.items():
            page = page.replace("{{" + k + "}}", v)
        leftover = [t for t in tokens if "{{" + t + "}}" in page]
        assert not leftover, f"{fname}: unreplaced {leftover}"
        (HERE / fname).write_text(page)
        print(f"  {fname:16s} {len(page)//1024:>3} KB")
    print(f"built {len(PAGES)} pages · {shown} reviews shown ({silent} rating-only omitted) "
          f"· {len(TOWNS)} map towns · all-ratings={SHOW_ALL_RATINGS}")

if __name__ == "__main__":
    main()
