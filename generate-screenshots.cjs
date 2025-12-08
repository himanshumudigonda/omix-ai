const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, 'public', 'assets');

// Create placeholder screenshots
const createScreenshot = (width, height, isWide) => {
  const title = isWide ? 'Desktop View' : 'Mobile View';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  
  <!-- Header bar -->
  <rect x="0" y="0" width="${width}" height="${height * 0.08}" fill="#1e293b"/>
  
  <!-- Logo -->
  <text x="${width * 0.05}" y="${height * 0.055}" font-family="Arial" font-size="${height * 0.035}" font-weight="bold" fill="#22c55e">Sarvix AI</text>
  
  <!-- Sidebar (desktop only) -->
  ${isWide ? `<rect x="0" y="${height * 0.08}" width="${width * 0.2}" height="${height * 0.92}" fill="#0f172a"/>` : ''}
  
  <!-- Chat area -->
  <rect x="${isWide ? width * 0.22 : width * 0.05}" y="${height * 0.15}" width="${isWide ? width * 0.55 : width * 0.9}" height="${height * 0.1}" rx="10" fill="#374151"/>
  <text x="${isWide ? width * 0.25 : width * 0.08}" y="${height * 0.21}" font-family="Arial" font-size="${height * 0.025}" fill="#94a3b8">How can I help you today?</text>
  
  <!-- AI Response bubble -->
  <rect x="${isWide ? width * 0.22 : width * 0.05}" y="${height * 0.28}" width="${isWide ? width * 0.55 : width * 0.9}" height="${height * 0.25}" rx="12" fill="#1f2937"/>
  <circle cx="${isWide ? width * 0.26 : width * 0.1}" cy="${height * 0.33}" r="${height * 0.03}" fill="#22c55e"/>
  <text x="${isWide ? width * 0.3 : width * 0.15}" y="${height * 0.34}" font-family="Arial" font-size="${height * 0.02}" fill="#f1f5f9">Sarvix AI</text>
  <text x="${isWide ? width * 0.25 : width * 0.08}" y="${height * 0.42}" font-family="Arial" font-size="${height * 0.018}" fill="#cbd5e1">Hello! I'm Sarvix AI, your intelligent assistant.</text>
  <text x="${isWide ? width * 0.25 : width * 0.08}" y="${height * 0.46}" font-family="Arial" font-size="${height * 0.018}" fill="#cbd5e1">I can help you with questions, generate images,</text>
  <text x="${isWide ? width * 0.25 : width * 0.08}" y="${height * 0.50}" font-family="Arial" font-size="${height * 0.018}" fill="#cbd5e1">and much more. What would you like to do?</text>
  
  <!-- Input area -->
  <rect x="${isWide ? width * 0.22 : width * 0.05}" y="${height * 0.85}" width="${isWide ? width * 0.55 : width * 0.9}" height="${height * 0.08}" rx="24" fill="#374151" stroke="#4b5563" stroke-width="1"/>
  <text x="${isWide ? width * 0.26 : width * 0.1}" y="${height * 0.90}" font-family="Arial" font-size="${height * 0.022}" fill="#6b7280">Type your message...</text>
  
  <!-- Send button -->
  <circle cx="${isWide ? width * 0.74 : width * 0.88}" cy="${height * 0.89}" r="${height * 0.025}" fill="#22c55e"/>
</svg>`;
};

async function generateScreenshots() {
  console.log('Generating placeholder screenshots...');

  // Wide screenshot (desktop)
  const wideSvg = createScreenshot(1280, 720, true);
  await sharp(Buffer.from(wideSvg))
    .png()
    .toFile(path.join(assetsDir, 'screenshot-wide.png'));
  console.log('Created screenshot-wide.png (1280x720)');

  // Narrow screenshot (mobile)
  const narrowSvg = createScreenshot(390, 844, false);
  await sharp(Buffer.from(narrowSvg))
    .png()
    .toFile(path.join(assetsDir, 'screenshot-narrow.png'));
  console.log('Created screenshot-narrow.png (390x844)');

  console.log('\n✅ Screenshots generated!');
  console.log('\n💡 Tip: Replace these with actual app screenshots for better store listing.');
}

generateScreenshots().catch(console.error);
