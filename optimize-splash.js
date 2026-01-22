const sharp = require('sharp');
const path = require('path');

const splashPath = path.join(__dirname, 'assets', 'images', 'splash.png');
const outputPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'drawable', 'splash_screen.png');

async function optimizeSplash() {
  console.log('Optimizing splash screen...');

  // Resize splash to a reasonable size (1080x2340 for modern phones)
  await sharp(splashPath)
    .resize(1080, 2340, {
      fit: 'cover',
      position: 'center'
    })
    .png({ quality: 90 })
    .toFile(outputPath);

  console.log('✓ Splash screen optimized!');
}

optimizeSplash().catch(console.error);
