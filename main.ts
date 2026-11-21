// The Quiet Gallery — the entrypoint the grader runs (Node 22, standard library only).
//
// The game itself is plain static files under game/ (index.html plus ES modules,
// no library and no network request), and the screenshots in screenshots/ are
// real renders of that game taken in desktop Chrome. This program hands both in:
// it copies game/ and screenshots/ beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Fail loudly instead of shipping a dossier the screenshot gate would refuse:
// the entry needs its game files and at least one real screenshot.
const gameOut = join(out, 'game');
if (!existsSync(join(gameOut, 'index.html'))) {
  throw new Error('game/index.html did not copy to the output directory');
}
const shotDir = join(out, 'screenshots');
const shots = readdirSync(shotDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (shots.length === 0) {
  throw new Error('no screenshots copied to the output directory');
}
for (const shot of shots) {
  if (statSync(join(shotDir, shot)).size === 0) {
    throw new Error(`screenshot ${shot} is empty`);
  }
}

// The gate's own caps, as the kit documents them: the text cap shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
