import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');

// Chromium: use CHROMIUM_PATH, o symlink do ambiente remoto, ou o resolvido
// pelo próprio playwright-core (PLAYWRIGHT_BROWSERS_PATH).
const CHROMIUM =
  process.env.CHROMIUM_PATH ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const FFMPEG = process.env.FFMPEG_PATH ?? 'ffmpeg';

const W = 1920, H = 1080, FPS = 30;

// ── Fontes: design system do repositório + Poppins local ────────
const FONTS = [
  { family: 'Chillax',   weight: 700, file: join(ROOT, 'public/fonts/chillax/Chillax-Bold.otf'),         format: 'opentype' },
  { family: 'Chillax',   weight: 600, file: join(ROOT, 'public/fonts/chillax/Chillax-Semibold.otf'),     format: 'opentype' },
  { family: 'Steelfish', weight: 700, file: join(ROOT, 'public/fonts/steelfish/Steelfish-Bold.otf'),     format: 'opentype' },
  { family: 'Steelfish', weight: 800, file: join(ROOT, 'public/fonts/steelfish/Steelfish-Extrabold.otf'), format: 'opentype' },
  { family: 'Poppins',   weight: 400, file: join(HERE, 'assets/Poppins-400.woff2'), format: 'woff2' },
  { family: 'Poppins',   weight: 500, file: join(HERE, 'assets/Poppins-500.woff2'), format: 'woff2' },
];

function fontFaceCss() {
  return FONTS.map(f => {
    const b64 = readFileSync(f.file).toString('base64');
    const mime = f.format === 'woff2' ? 'font/woff2' : 'font/otf';
    return `@font-face { font-family: '${f.family}'; font-weight: ${f.weight}; ` +
      `src: url(data:${mime};base64,${b64}) format('${f.format}'); }`;
  }).join('\n');
}

async function main() {
  const mode = process.argv[2] ?? 'full'; // 'preview' | 'full'
  const OUT = join(HERE, 'out');
  mkdirSync(OUT, { recursive: true });

  const template = readFileSync(join(HERE, 'promo.html'), 'utf8');
  const html = template.replace('/*__FONTS__*/', fontFaceCss());
  const composed = join(OUT, 'composed.html');
  writeFileSync(composed, html);

  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ['--force-color-profile=srgb', '--hide-scrollbars', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + composed);
  await page.evaluate(async () => { await document.fonts.ready; });

  const duration = await page.evaluate('window.DURATION');

  if (mode === 'preview') {
    const dir = join(OUT, 'preview');
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const t of [1.2, 2.4, 4.6, 5.8, 8.6, 12.0, 15.1]) {
      await page.evaluate(`window.seek(${t})`);
      await page.screenshot({ path: join(dir, `t${t.toFixed(1)}.png`) });
      console.log(`preview t=${t}`);
    }
  } else {
    const dir = join(OUT, 'frames');
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const total = Math.round(duration * FPS);
    const t0 = Date.now();
    for (let i = 0; i < total; i++) {
      await page.evaluate(`window.seek(${i / FPS})`);
      await page.screenshot({
        path: join(dir, `f${String(i).padStart(4, '0')}.jpg`),
        type: 'jpeg', quality: 92,
      });
      if (i % 60 === 0) console.log(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    console.log(`captura concluída: ${total} frames em ${((Date.now() - t0) / 1000).toFixed(0)}s`);

    const out = join(OUT, 'wing-promo.mp4');
    execFileSync(FFMPEG, [
      '-y', '-framerate', String(FPS),
      '-i', join(dir, 'f%04d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      out,
    ], { stdio: 'inherit' });
    console.log('vídeo gerado:', out);
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
