# anirud.dev

Personal site. Three files, no build step, no dependencies. Open `index.html` or
serve the folder.

```bash
python -m http.server 8123
```

Live at [anirudiye.github.io](https://anirudiye.github.io), served from `main`.

- `index.html` structure and copy
- `styles.css` one stylesheet, desktop layout collapsing to mobile at 860px
- `script.js` terminal intro, Waterloo clock, marquee measurement, mailto form
- `motion.js` scroll-linked animation, on anime.js
- `text.js` the drawn name, the rotating phrase, the particle heading
- `interactions.js` caret sweep, border trace, glyph burst
- `backgrounds.js` the hero scanner and the contact letter grid
- `vendor/anime.umd.min.js` anime.js 4.5.0, pinned and vendored
- `docs/ai-writing-tells.md` the research the copy was written against
- `Personal Site.dc.html` the original Claude Design export this was built from

Asset URLs carry a `?v=` query. Bump it in `index.html` whenever a CSS or JS
file changes, or returning visitors sit on a stale copy for ten minutes.

## Palette and type

Drafting and instrumentation: a deep blueprint navy rather than black, cool
chalk white for the line work, signal amber for emphasis, and a cyan that
reads as a circuit trace for links. It is the vocabulary of what Anirud
actually builds, which is robotics, circuits and board diagrams.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#081119` | blueprint ground |
| `--ink` | `219 228 234` | chalk, all body text |
| `--amber` | `224 160 60` | emphasis, kickers, the drawn outline |
| `--trace` | `82 182 196` | links and the secondary accent |

The three accents are declared as raw channels, so every translucent use is
`rgb(var(--ink-rgb) / .42)` rather than a repeated triplet. Retuning the
palette is three edits, not fifty.

Type is **Archivo** over **IBM Plex Mono**.

Both choices are deliberate moves away from where generated design
converges. Near-black with a single vermilion accent is one of three
documented default looks, and cream plus terracotta plus a mono face is the
2026 signature; the previous palette sat on both. Inter is the single
most-cited typographic tell and was the previous body face. Navy with amber
sits on neither list, and amber against blue is complementary rather than
analogous, so emphasis separates from the ground without extra saturation.

Contrast on the new ground, measured: body text 14.75:1, amber 8.39:1, trace
8.01:1. All three clear WCAG AAA.

## Motion

Two rules, both deliberate.

**Scroll animation is scrubbed, never triggered.** A triggered reveal owns a
duration, so it makes you wait for content already on screen. Nielsen Norman
found readers describe that as a loading delay and put the usable range at
100 to 400ms, against the 600 to 800ms most sites ship. A scrubbed animation
is a function of scroll position, so it has no duration to wait through and
it runs backwards when you scroll back.

**Nothing here is the generated default.** For scroll that default is
opacity 0 to 1 plus `translateY(20px)`, from an IntersectionObserver at
`threshold: 0.1`, staggered `index * 100`ms, over 600ms, on
`cubic-bezier(0.4, 0, 0.2, 1)`. For buttons it is `hover:scale-105`, a
`shadow-lg` lift, and a gradient shine. None of those values appear in this
repo. Reveals are mask and clip wipes with no opacity on text; hover is a
caret sweep and a drawn border.

Everything respects `prefers-reduced-motion`. anime.js has no handling of its
own, so each module checks and returns early.

### Known library bug

anime.js 4.5.0 throws inside `refresh()` on any `onScroll` observer given an
explicit `target`, whether a selector string or a resolved element. Every
observer in `motion.js` therefore omits `target` and defaults to the elements
it animates. Worth rechecking on the next upgrade.

## Still needs filling in

Everything below is marked in the HTML with `data-needs-url`, so
`grep -n 'data-needs-url' index.html` finds all of them.

| Marker | What it needs |
|---|---|
| `resume` | A `resume.pdf` in this folder. Three links. |
| `portrait` | A photo for the About panel. Replace the dashed box with an `<img>`. |
| `shot-footyboard` | Screenshot of FootyBoard. |
| `shot-betterdresser` | Screenshot of BetterDresser. |

The contact email is set to `iyengar.anirud@gmail.com` in both `index.html` and
`script.js`. Change it in both places if you would rather use another address.

## Facts on the page

Every claim is checkable. If any of these stop being true, they need editing:

- Term 1A, Fall 2026, looking for a Summer 2027 co-op
- FootyBoard live at footyboard.me
- BetterDresser live at betterdresser.vercel.app
- Skills Ontario robotics, eighth place, 2024 and 2025
- Distinction in every CEMC contest written (Euclid, Fermat, Cayley)
- CSMC 2025, 42/60 with distinction
- OAPT 2025, 92nd percentile
- Avogadro 2025, distinction, top five in the school
- Standard First Aid and National Lifeguard certification
- 300+ hours tutoring, 350+ hours robotics, 10+ hours of published YouTube content

## Writing rules

The copy follows `docs/ai-writing-tells.md`. The short version:

1. No em dashes, anywhere, including comments.
2. No words from the LLM-overuse list (delve, showcase, boast, underscore,
   pivotal, vibrant, testament, and the rest).
3. No sentence whose job is to say that the previous sentence mattered.
4. No trailing "-ing" clause that draws a conclusion the evidence does not carry.
5. Every claim carries a number, name, date, or constraint.
6. Vary sentence length on purpose. Some sentences should be very short.

Before committing new copy:

```bash
grep -rniE 'delve|showcas|boast|underscor|pivotal|vibrant|testament|intricat|seamless|robust|leverage|foster' index.html
```
