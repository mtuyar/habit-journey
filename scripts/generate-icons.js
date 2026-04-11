const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets', 'images');

// ── Shared leaf + path SVG elements ──────────────────────────────────────────
// Canvas: 1024×1024. Single leaf, tilted ~35°, fills ~85% of canvas.
// Tip: (800, 150)   Base: (210, 870)
// One continuous closed path — right edge curves out, left edge curves back.

const leafPath = `
  M 800 150
  C 920 310, 820 530, 510 640
  C 390 680, 270 770, 210 870
  C 100 760, 210 560, 370 440
  C 530 320, 660 190, 800 150
  Z
`;

// S-curve road along the leaf center (base → tip)
const roadPath = `M 230 840 C 360 700, 420 590, 510 510 C 610 430, 710 310, 780 170`;

// ── 1. iOS icon — white bg, leaf + road ──────────────────────────────────────
const iosSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="leafGrad" cx="55%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#22a65a"/>
      <stop offset="100%" stop-color="#0a4a28"/>
    </radialGradient>
    <clipPath id="roundedClip">
      <rect width="1024" height="1024" rx="200" ry="200"/>
    </clipPath>
  </defs>

  <!-- White background -->
  <rect width="1024" height="1024" rx="200" ry="200" fill="#ffffff"/>

  <!-- Subtle teal glow behind leaf -->
  <ellipse cx="510" cy="512" rx="420" ry="420" fill="#0D948808"/>

  <!-- Leaf shape -->
  <path d="${leafPath.trim()}" fill="url(#leafGrad)" clip-path="url(#roundedClip)"/>

  <!-- Curved road on leaf -->
  <path d="${roadPath}" fill="none" stroke="white" stroke-width="58" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
</svg>
`;

// ── 2. Android foreground — transparent bg, leaf + road, safe-zone padded ───
// Shrink to ~80% (820px effective) → scale 0.80, translate 102px each side
const androidFgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="leafGrad2" cx="55%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#22a65a"/>
      <stop offset="100%" stop-color="#0a4a28"/>
    </radialGradient>
  </defs>

  <!-- Transparent background (no rect) -->

  <g transform="translate(102 102) scale(0.80)">
    <!-- Leaf shape -->
    <path d="${leafPath.trim()}" fill="url(#leafGrad2)"/>

    <!-- Curved road on leaf -->
    <path d="${roadPath}" fill="none" stroke="white" stroke-width="58" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
  </g>
</svg>
`;

// ── 3. Android monochrome — transparent bg, white silhouette ─────────────────
const androidMonoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <!-- Transparent background (no rect) -->

  <g transform="translate(102 102) scale(0.80)">
    <!-- White leaf silhouette -->
    <path d="${leafPath.trim()}" fill="white"/>

    <!-- Subtle road (dark stroke on white) -->
    <path d="${roadPath}" fill="none" stroke="rgba(0,0,0,0.30)" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

// ── Generate PNGs ─────────────────────────────────────────────────────────────
async function generate() {
  const tasks = [
    { svg: iosSvg,         file: 'icon.png',                    label: 'iOS icon' },
    { svg: androidFgSvg,   file: 'android-icon-foreground.png', label: 'Android foreground' },
    { svg: androidMonoSvg, file: 'android-icon-monochrome.png', label: 'Android monochrome' },
  ];

  for (const { svg, file, label } of tasks) {
    const outPath = path.join(OUT, file);
    await sharp(Buffer.from(svg))
      .resize(1024, 1024)
      .png()
      .toFile(outPath);
    console.log(`✓ ${label} → ${file}`);
  }

  console.log('\nDone! 3 icons generated.');
}

generate().catch(err => { console.error(err); process.exit(1); });
