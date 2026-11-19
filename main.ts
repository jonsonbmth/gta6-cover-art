// Sunset Press — a GTA 6-style cover art maker: the entry program.
// Node 22, standard library only. It hands the app in by copying the static
// app/ folder and the screenshots/ folder beside this file into the output
// directory, then writing dossier.json with make.fun's own library
// (vendor/makefun-app.ts), the same library the scorer rebuilds the dossier
// with. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output, so `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` writes
// the entry to out/ for a local look. The program is deterministic: two
// runs write the same bytes, because it only copies files and builds the
// dossier from them.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty (reference/gate.json): the dossier text
// is capped at 160 KiB, screenshots at 4 files of 256 KiB each, app/ at 993
// files and 48 MiB with no path over 1000 bytes.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyIfPresent(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyIfPresent('app');
copyIfPresent('screenshots');

const dossier = buildDossier(outDir, DOSSIER_LIMITS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A one-line receipt on stdout so a local run shows what was handed in,
// including the dossier size for a quick limits check.
console.log(`Sunset Press handed in: app/ + screenshots/ + dossier.json (${Buffer.byteLength(dossier)} bytes) -> ${outDir}`);
