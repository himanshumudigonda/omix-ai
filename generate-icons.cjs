const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'public', 'assets');

// SVG content for the Sarvix AI icon
const createIconSvg = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const cornerRadius = maskable ? 0 : size * 0.166;
  const fontSize = innerSize * 0.52;
  const aiSize = innerSize * 0.104;
  const centerX = size / 2;
  const centerY = size / 2;
  const glowRadius = innerSize * 0.31;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${cornerRadius}" fill="url(#bgGrad)"/>
  <!-- Glow effect -->
  <circle cx="${centerX}" cy="${centerY}" r="${glowRadius}" fill="#22c55e" opacity="0.15"/>
  <!-- S Letter -->
  <text x="${centerX}" y="${centerY + fontSize * 0.15}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="url(#sGrad)" text-anchor="middle">S</text>
  <!-- Small AI text -->
  <text x="${centerX}" y="${centerY + fontSize * 0.5}" font-family="Arial, Helvetica, sans-serif" font-size="${aiSize}" font-weight="500" fill="#94a3b8" text-anchor="middle">AI</text>
</svg>`;
};

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Generate standard icons
  const sizes = [192, 512];
  
  for (const size of sizes) {
    // Standard icon
    const standardSvg = createIconSvg(size, false);
    await sharp(Buffer.from(standardSvg))
      .png()
      .toFile(path.join(assetsDir, `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);

    // Maskable icon (with safe zone padding)
    const maskableSvg = createIconSvg(size, true);
    await sharp(Buffer.from(maskableSvg))
      .png()
      .toFile(path.join(assetsDir, `icon-maskable-${size}.png`));
    console.log(`Created icon-maskable-${size}.png`);
  }

  console.log('\n✅ All PWA icons generated successfully!');
  console.log('\nGenerated files:');
  console.log('  - icon-192.png (standard)');
  console.log('  - icon-512.png (standard)');
  console.log('  - icon-maskable-192.png (for adaptive icons)');
  console.log('  - icon-maskable-512.png (for adaptive icons)');
}

generateIcons().catch(console.error);
