# anirud.dev

Personal site. Three files, no build step, no dependencies. Open `index.html` or
serve the folder.

```bash
python -m http.server 8123
```

- `index.html` structure and copy
- `styles.css` one stylesheet, desktop layout collapsing to mobile at 860px
- `script.js` terminal intro, Waterloo clock, marquee loop, mailto form
- `docs/ai-writing-tells.md` the research the copy was written against
- `Personal Site.dc.html` the original Claude Design export this was built from

## Still needs filling in

Everything below is marked in the HTML with `data-needs-url`, so
`grep -n 'data-needs-url' index.html` finds all of them.

| Marker | What it needs |
|---|---|
| `github` | GitHub profile URL. Three links point at github.com right now. The quick-link label also reads `clone github.com/anirud`, which needs the real handle. |
| `linkedin` | LinkedIn profile URL. Two links. |
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
- CSMC 2025, 42/60
- OAPT 2025, 92nd percentile
- Avogadro 2025, distinction, one of five in the school

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
