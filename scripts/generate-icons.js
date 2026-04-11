const sharp = require('sharp');
const path = require('path');

const SRC  = path.join(__dirname, '..', 'assets', 'images', 'app-icons', 'ios', 'icon-1024x1024.png');
const OUT  = path.join(__dirname, '..', 'assets', 'images');

async function generate() {
  // ── 1. iOS icon — use source as-is (already 1024×1024, white bg, rounded) ──
  await sharp(SRC)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(OUT, 'icon.png'));
  console.log('✓ iOS icon → icon.png');

  // ── 2. Android foreground — safe-zone: shrink to 82%, transparent outside ──
  // Place 840×840 centered inside 1024×1024 transparent canvas
  const fgSize  = 840;
  const fgPad   = Math.round((1024 - fgSize) / 2); // 92px each side
  const fgBuf   = await sharp(SRC).resize(fgSize, fgSize).png().toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: fgBuf, top: fgPad, left: fgPad }])
    .png()
    .toFile(path.join(OUT, 'android-icon-foreground.png'));
  console.log('✓ Android foreground → android-icon-foreground.png');

  // ── 3. Android monochrome — white silhouette on transparent ─────────────────
  // Flatten white bg → convert to greyscale → threshold → white on transparent
  const monoSize = 840;
  const monoPad  = Math.round((1024 - monoSize) / 2);
  const monoBuf  = await sharp(SRC)
    .resize(monoSize, monoSize)
    .flatten({ background: '#ffffff' }) // make alpha areas white
    .greyscale()
    .threshold(200)                    // white pixels stay white, dark ones black
    .negate()                          // invert: leaf becomes white, bg black
    .toColourspace('b-w')
    .png()
    .toBuffer();

  // Re-composite: make black pixels transparent, keep white
  const { data, info } = await sharp(monoBuf)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build RGBA buffer: white where pixel is white, transparent elsewhere
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const v = data[i]; // greyscale value
    rgba[i * 4 + 0] = 255; // R
    rgba[i * 4 + 1] = 255; // G
    rgba[i * 4 + 2] = 255; // B
    rgba[i * 4 + 3] = v;   // Alpha = pixel brightness
  }

  const silhouetteBuf = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: silhouetteBuf, top: monoPad, left: monoPad }])
    .png()
    .toFile(path.join(OUT, 'android-icon-monochrome.png'));
  console.log('✓ Android monochrome → android-icon-monochrome.png');

  // ── 4. Splash icon — centered leaf, no rounded corners, transparent bg ─────
  await sharp(SRC)
    .resize(512, 512)
    .png()
    .toFile(path.join(OUT, 'splash-icon.png'));
  console.log('✓ Splash icon → splash-icon.png');

  // ── 5. Favicon — 64×64 ───────────────────────────────────────────────────────
  await sharp(SRC)
    .resize(64, 64)
    .png()
    .toFile(path.join(OUT, 'favicon.png'));
  console.log('✓ Favicon → favicon.png');

  console.log('\nDone! 5 icons generated from icon-last.png');
}

generate().catch(err => { console.error(err); process.exit(1); });
