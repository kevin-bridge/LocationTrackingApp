const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const splashPath = path.join(__dirname, 'assets', 'images', 'logo.png');
const androidResPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Different drawable densities
const densities = {
  'drawable-mdpi': 1,
  'drawable-hdpi': 1.5,
  'drawable-xhdpi': 2,
  'drawable-xxhdpi': 3,
  'drawable-xxxhdpi': 4
};

async function createSplashScreens() {
  console.log('Creating splash screens...');

  // Base size (mdpi) - using a reasonable size for splash
  const baseWidth = 320;
  const baseHeight = 480;

  for (const [folder, scale] of Object.entries(densities)) {
    const folderPath = path.join(androidResPath, folder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const width = Math.floor(baseWidth * scale);
    const height = Math.floor(baseHeight * scale);
    const outputPath = path.join(folderPath, 'splash_screen.png');

    await sharp(splashPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${folder} splash (${width}x${height})`);
  }

  console.log('✓ All splash screens generated successfully!');
}

createSplashScreens().catch(console.error);
