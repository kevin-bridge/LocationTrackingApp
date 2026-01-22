const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');
const androidResPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

async function generateIcons() {
  console.log('Generating app icons...');

  for (const [folder, size] of Object.entries(sizes)) {
    const folderPath = path.join(androidResPath, folder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const outputPath = path.join(folderPath, 'ic_launcher.png');
    const roundOutputPath = path.join(folderPath, 'ic_launcher_round.png');

    // Make icon larger - use only 5% padding instead of default Android adaptive icon padding
    const paddedSize = Math.floor(size * 1.1); // Make it 10% larger
    await sharp(iconPath)
      .resize(paddedSize, paddedSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extract({
        left: Math.floor((paddedSize - size) / 2),
        top: Math.floor((paddedSize - size) / 2),
        width: size,
        height: size
      })
      .png()
      .toFile(outputPath);

    // Round icon - even larger
    await sharp(iconPath)
      .resize(paddedSize, paddedSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extract({
        left: Math.floor((paddedSize - size) / 2),
        top: Math.floor((paddedSize - size) / 2),
        width: size,
        height: size
      })
      .png()
      .toFile(roundOutputPath);

    console.log(`✓ Generated ${folder} icons (${size}x${size})`);
  }

  console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
