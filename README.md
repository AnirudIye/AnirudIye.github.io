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
- `motion.js` scroll-linked animation and the work section entrance, on anime.js
- `text.js` the drawn name, the rotating phrase, the particle heading
- `interactions.js` caret sweep, border trace, glyph burst
- `backgrounds.js` the ambient field, mounted twice
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

Three places hold colours that a token change will not reach, so they need
editing by hand alongside it: `SCANNER.channels` in `backgrounds.js`, the
deposit colours in `motion.js`, and the favicon data URI plus the
`theme-color` meta in `index.html`.

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
repo. Reveals are mask wipes with no opacity on text; hover is a caret sweep
and a drawn border.

Everything respects `prefers-reduced-motion`. anime.js has no handling of its
own, so each module checks and returns early.

### The work section is the one exception, on purpose

`plot()` in `motion.js` is triggered rather than scrubbed. Do not "fix" it to
match the first rule, because it already follows the reasoning behind that
rule rather than breaking it.

The cards used to be revealed by a scrubbed clip wipe. Measured at 1440x900
on a freshly loaded page, that left the first card at
`inset(0 90.7% 0 0)` and the second at `inset(0 99.7% 0 0)` while both sat
inside the fold, so a reader who did not scroll saw 9% of one project and
none of the other. The rule exists so nobody waits for content already on
screen. That wipe was the thing making them wait.

So the cards are fully drawn at first paint, at every scroll position, and
the entrance plays over the top of them: corner brackets, a plotter head
running down each card, and deposits firing under it as it crosses the
screenshot, the live link and the stack chips. Nothing it touches gates
legibility, and every frozen frame of it is readable.

Its deposit timings are computed from measured geometry rather than picked by
hand, so they follow the elements if the card changes height or the copy
grows.

### Known library bugs

Three, all in anime.js 4.5.0, all found the hard way.

**An explicit `target` breaks `refresh()`.** Any `onScroll` observer given one
throws on a null internal reference, whether the target is a selector string
or a resolved element. Every observer in `motion.js` omits `target` and
defaults to the elements it animates.

**Colours must use the comma syntax.** `rgb(r g b / a)` passes anime's
`indexOf('rgb') === 0` check, enters the colour branch, then throws on a null
regex match, because the regexes behind it are comma-only. The stylesheet uses
the space-separated form throughout, so anything handed to `animate()` needs
converting: `rgba(224, 160, 60, 0.5)`, not `rgb(224 160 60 / .5)`.

**It leaves what it animates as an inline style.** Settling on the right value
is not the same as handing the property back. An inline colour outranks every
selector without `!important`, which silently killed `.live:hover` on the two
links to the shipped work, and it pins the element to whatever the token held
at the time so a palette retune no longer reaches it. Every deposit in
`plot()` removes its property in `onComplete`.

All three are worth rechecking on the next upgrade.

## The ambient field

One effect, mounted twice, in `backgrounds.js`. It is a canvas 2D rebuild of
a WebGL contour scanner: about fifteen wavy polylines stroked three times each
in cyan, amber and chalk, under a sweep envelope that crosses roughly every
eight seconds. Shipping a GL context and a shader compiler onto a page with no
build step was the wrong trade.

- The **top field** runs from the very top of the document to the bottom of
  the work section, so the header, the intro and both project cards sit on one
  unbroken piece of it.
- The **contact field** closes the page at `--field-strength: .18`.

The achievement rows and the now block get no field. Painting it behind all
five sections makes it wallpaper and costs the hero its status as the hero.

**Every field is edge to edge, and that is why the top one is a
document-level layer** rather than a canvas inside `.work`. `.work` is capped
at `--maxw` and centred, so a canvas hosted there measured 1280 wide against a
1425 page and stopped 80px short of both edges while the header above it ran
full bleed. `.contact` and `.marquee-section` are already full bleed and cap
their inner blocks instead, which is the pattern the stylesheet uses
throughout.

Strength falls over the work section as a mask rather than a second canvas, so
the contour lines carry through the seam instead of restarting at it.
`--field-hold` is the intro's bottom edge as a percentage of the layer,
measured in `backgrounds.js`; the mask holds full strength above it and eases
to 55% over the next fifth of the height.

Both mounts share one `requestAnimationFrame` loop and skip any host that is
off screen or backgrounded.

There is deliberately **no vignette**. One was declared on `::before` for a
long time and never painted: `::before`, the canvas and `::after` all sit at
`z-index: 0`, so they paint in tree order and `::before` comes before the
canvas. It was fading to each host's own ground colour underneath an
almost-transparent canvas. Raising it above the canvas was tried and rejected,
because at its stops it erased most of the hero field. `::after` is above the
canvas for the same tree-order reason, which is why the scanline does work.

## Layout: the fold

The page exists to put two shipped projects in front of a recruiter, so the
vertical rhythm of the header, the intro and the work section is tuned against
one number: where the first card's title lands.

At 1440x900, freshly loaded and not scrolled, both project titles and their
`live` links sit at y=687 to 713, with roughly 175 of each 240px screenshot
above the fold. At 1366x768 the titles and links still clear it, though only
about 43px of screenshot does.

Two things hold that up, and both are easy to undo by accident:

- **The intro is a grid, so its height is the taller of its two columns.** The
  about panel used to run 19px past the terminal column, which meant
  tightening the terminal alone moved nothing at all. The portrait is capped
  at 160px because that column sets the height.
- **Each card leads with its name, not its screenshot.** The shot is 240px
  tall, so putting it first pushed the title down by exactly that much, and no
  spacing above could recover it without letterboxing the screenshots to about
  3:1.

## Still needs filling in

Everything below is marked in the HTML with `data-needs-url`, so
`grep -n 'data-needs-url' index.html` finds all of them.

| Marker | What it needs |
|---|---|
| `resume` | A `resume.pdf` in this folder. Three links. |
| `portrait` | A photo for the About panel, square crop. Replace the dashed box with an `<img>`. |
| `shot-footyboard` | Screenshot of FootyBoard, roughly 16:9. |
| `shot-betterdresser` | Screenshot of BetterDresser, roughly 16:9. |

The two screenshots are the highest-value thing left. The work section already
animates as though a picture is there, and until one is, the plotter head
crosses an empty dashed box.

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
