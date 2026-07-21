#!/usr/bin/env node
// Regenerate the README hero screenshot.
//
//   npm run dev            # in one terminal
//   node scripts/screenshot.mjs
//
// Captures the Write screen with a sample entry at 2× for a crisp image,
// in both dark and light themes, into docs/.

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2]?.replace(/\/$/, '') || 'http://localhost:5173';

const ENTRY = [
  'Cut the first two pages of chapter four. The scene starts where Mara opens the letter — everything before it was throat-clearing. 380 words lighter and the chapter reads faster.',
  '',
  "Noticed I keep reaching for weather when I don't know what a character feels. Flagging it.",
].join('\n');

const browser = await chromium.launch();

async function shot(theme, file) {
  const page = await browser.newPage({
    viewport: { width: 1180, height: 760 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  await page.goto(`${base}/?seed`);

  // Force the theme regardless of OS preference, then let the first-load
  // confetti glyph finish so the tile shows its typing equalizer instead.
  await page.evaluate((t) => window.__oscar?.getStore().setTheme(t), theme);
  await page.waitForTimeout(2600);

  const editor = page.getByLabel('Journal entry');
  await editor.click();
  await editor.fill(ENTRY);
  await page.waitForTimeout(400); // let the tile settle on a frame
  await editor.evaluate((el) => el.blur()); // drop the blinking caret

  await page.screenshot({ path: resolve(root, file) });
  await page.close();
  console.log('wrote', file);
}

await shot('dark', 'docs/oscar-dark.png');
await shot('light', 'docs/oscar-light.png');

await browser.close();
