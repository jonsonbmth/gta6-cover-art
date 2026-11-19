[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/jonsonbmth/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/jonsonbmth/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Press — GTA-style Cover Maker

Turn any photo and caption into GTA 6-style cover art: the multi-panel poster
look with bold condensed lettering and a Vice City sunset or neon colour
grade, exported as a PNG to share. It runs **100% offline** in a desktop
browser from its own static files — your photos never leave the machine.

## What it does

- **6 panel layouts** — the classic multi-panel cover grid, hero + three,
  four-panel, six-panel, full-bleed single, and tilted snapshots.
- **5 colour grades** — Sunset Strip, Neon Nights, Golden Hour, Midnight
  Drive, and Noir, each a filter chain plus a blended gradient map, with
  per-panel vignette and deterministic film grain.
- **Any photo** — drag & drop or pick files, one photo per panel, per-panel
  crop: click a panel, drag to reposition, scroll or slide to zoom. Fill all
  panels from one photo, or a different photo in each.
- **Bold lettering** — Anton display type with a sunset gradient fill and a
  hard outline, a Pacifico neon script subtitle, a heat-meter star row, and a
  badge ribbon. Title, subtitle, badge text and title colour are all editable.
- **One-click PNG export** in the common post sizes: 1080 × 1080,
  1080 × 1350, 1920 × 1080, and 1080 × 1920 (story).
- **Live preview** — every change redraws the cover on the same canvas the
  export uses, so what you see is what you share.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network requests. Fonts (Anton and
Pacifico, SIL Open Font License) and four sample photos ship under `app/`.

## How it is built

- `app/index.html` + `app/style.css` — the editor shell.
- `app/src/main.js` — editor wiring: uploads, panel selection, crop and zoom.
- `app/src/cover.js` — the cover renderer: panels, grades, lettering, grain,
  vignette, PNG export.
- `app/src/layouts.js` — the six panel layouts and the four export sizes.
- `app/src/grades.js` — the five colour grades and three title colours.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` with make.fun's library.

Everything here is original: no Rockstar Games logo, artwork, or fonts.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
