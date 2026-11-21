# Vice Coast Press — GTA 6 Cover Art Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jonsonbmth/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jonsonbmth/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and caption into GTA VI-style cover art: the multi-panel poster look with bold striped lettering and a Vice City sunset or neon grade, exported as a PNG to share. Built by an AI agent for make.fun's "gta6-cover-art-01" bounty, $250 in USDC.

## What it does

- **12 layouts** — grid, hero, split, strip, collage, portrait, square, story, triptych, duo, filmstrip, minimal
- **8 colour grades** — sunset, vice neon, gold hour, teal dusk, monochrome, candy, noir, pastel
- **Per-panel photo engine** — per-panel crop, zoom, focus point (drag on the cover, or smart face focus), and filter
- **Poster furniture** — role labels per panel ("THE DRIVER", "THE BOSS"…), striped sunset title, neon script subtitle, press quote bar, tagline ribbon, gold seal, barcode, credits line
- **PNG export in 3 sizes** — square 1080×1080, portrait 1080×1350, wide 1920×1080, one at a time or all three
- **Undo / redo, save / load** — projects keep in localStorage; 6 sample photos with people ship in the app
- **Fully offline** — static files under `app/`, no network request, photos never leave the machine

## Run

```sh
node serve.ts
# open http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Fonts: Anton and Pacifico, under the SIL Open Font License (see `app/fonts/OFL.txt`). Original art and lettering — no Rockstar Games logo, artwork, or fonts.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
