// Vice Coast Press — the entry program (Node 22, standard library only).
// It hands the app in: copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library.
// The grader runs it twice and both runs must write the same bytes: this
// program copies files and builds the dossier from their contents only, so
// its output is a pure function of the repository (no timestamps, no random
// values, no network).
//
// Try the app first: `node serve.ts`, then open http://localhost:8080.
// Build the hand-in locally: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps (reference/gate.json): the dossier text is capped at 160 KiB,
// screenshots at 4 files of 256 KiB each, app/ at 993 files and 48 MiB in all.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
