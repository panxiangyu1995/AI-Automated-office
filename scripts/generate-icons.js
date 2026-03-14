import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 品牌色：深蓝色 #1E3A5F
const BRAND_COLOR = '#1E3A5F';
const BACKGROUND_COLOR = '#FFFFFF';

// 需要生成的图标尺寸列表
const iconSizes = [
  { name: 'icon.png', size: 1024 },
  { name: '32x32.png', size: 32 },
  { name: '64x64.png', size: 64 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
];

// Windows Store Logo 尺寸
const storeLogos = [
  { name: 'Square30x30Logo.png', size: 30 },
  { name: 'Square44x44Logo.png', size: 44 },
  { name: 'Square71x71Logo.png', size: 71 },
  { name: 'Square89x89Logo.png', size: 89 },
  { name: 'Square107x107Logo.png', size: 107 },
  { name: 'Square142x142Logo.png', size: 142 },
  { name: 'Square150x150Logo.png', size: 150 },
  { name: 'Square284x284Logo.png', size: 284 },
  { name: 'Square310x310Logo.png', size: 310 },
  { name: 'StoreLogo.png', size: 50 },
];

// iOS 图标尺寸
const iosIcons = [
  { name: 'ios/AppIcon-20x20@1x.png', size: 20 },
  { name: 'ios/AppIcon-20x20@2x-1.png', size: 40 },
  { name: 'ios/AppIcon-20x20@2x.png', size: 40 },
  { name: 'ios/AppIcon-20x20@3x.png', size: 60 },
  { name: 'ios/AppIcon-29x29@1x.png', size: 29 },
  { name: 'ios/AppIcon-29x29@2x-1.png', size: 58 },
  { name: 'ios/AppIcon-29x29@2x.png', size: 58 },
  { name: 'ios/AppIcon-29x29@3x.png', size: 87 },
  { name: 'ios/AppIcon-40x40@1x.png', size: 40 },
  { name: 'ios/AppIcon-40x40@2x-1.png', size: 80 },
  { name: 'ios/AppIcon-40x40@2x.png', size: 80 },
  { name: 'ios/AppIcon-40x40@3x.png', size: 120 },
  { name: 'ios/AppIcon-60x60@2x.png', size: 120 },
  { name: 'ios/AppIcon-60x60@3x.png', size: 180 },
  { name: 'ios/AppIcon-76x76@1x.png', size: 76 },
  { name: 'ios/AppIcon-76x76@2x.png', size: 152 },
  { name: 'ios/AppIcon-83.5x83.5@2x.png', size: 167 },
  { name: 'ios/AppIcon-512@2x.png', size: 1024 },
];

// Android 图标尺寸
const androidIcons = [
  { path: 'android/mipmap-mdpi/ic_launcher.png', size: 48 },
  { path: 'android/mipmap-mdpi/ic_launcher_round.png', size: 48 },
  { path: 'android/mipmap-hdpi/ic_launcher.png', size: 72 },
  { path: 'android/mipmap-hdpi/ic_launcher_round.png', size: 72 },
  { path: 'android/mipmap-hdpi/ic_launcher_foreground.png', size: 72 },
  { path: 'android/mipmap-xhdpi/ic_launcher.png', size: 96 },
  { path: 'android/mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  { path: 'android/mipmap-xhdpi/ic_launcher_foreground.png', size: 96 },
  { path: 'android/mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { path: 'android/mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  { path: 'android/mipmap-xxhdpi/ic_launcher_foreground.png', size: 144 },
  { path: 'android/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { path: 'android/mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
  { path: 'android/mipmap-xxxhdpi/ic_launcher_foreground.png', size: 192 },
];

/**
 * 生成 SVG 图标源 - "Realline" 蓝字白底
 * 增加 padding 确保文字不被裁剪
 */
function generateSVG(size) {
  const padding = Math.floor(size * 0.15);
  const usableWidth = size - (padding * 2);
  const fontSize = Math.floor(usableWidth * 0.28); // 调整字体大小以适应可用宽度

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${BRAND_COLOR}"
        text-anchor="middle"
        dominant-baseline="central"
      >Realline</text>
    </svg>
  `.trim();
}

/**
 * 生成指定尺寸的图标
 */
async function generateIcon(targetPath, size) {
  const svg = generateSVG(size);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(targetPath);

  console.log(`Generated: ${targetPath} (${size}x${size})`);
}

/**
 * 主函数
 */
async function main() {
  const iconsDir = path.join(__dirname, '../src-tauri/icons');

  console.log('开始生成 Realline 蓝字白底图标...\n');

  // 确保目录存在
  const dirs = [
    iconsDir,
    path.join(iconsDir, 'ios'),
    path.join(iconsDir, 'android/mipmap-mdpi'),
    path.join(iconsDir, 'android/mipmap-hdpi'),
    path.join(iconsDir, 'android/mipmap-xhdpi'),
    path.join(iconsDir, 'android/mipmap-xxhdpi'),
    path.join(iconsDir, 'android/mipmap-xxxhdpi'),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  // 生成基础图标
  console.log('--- 生成基础图标 ---');
  for (const icon of iconSizes) {
    await generateIcon(path.join(iconsDir, icon.name), icon.size);
  }

  // 生成 Windows Store Logo
  console.log('\n--- 生成 Windows Store Logo ---');
  for (const logo of storeLogos) {
    await generateIcon(path.join(iconsDir, logo.name), logo.size);
  }

  // 生成 iOS 图标
  console.log('\n--- 生成 iOS 图标 ---');
  for (const icon of iosIcons) {
    await generateIcon(path.join(iconsDir, icon.name), icon.size);
  }

  // 生成 Android 图标
  console.log('\n--- 生成 Android 图标 ---');
  for (const icon of androidIcons) {
    await generateIcon(path.join(iconsDir, icon.path), icon.size);
  }

  // 生成 ICO 文件 (需要使用 icon.png 作为源)
  console.log('\n--- 生成 ICO 文件 ---');
  const iconPng = path.join(iconsDir, 'icon.png');
  await sharp(iconPng)
    .toFile(path.join(iconsDir, 'icon.ico'));
  console.log('Generated: icon.ico');

  // 生成 ICNS 文件 - 使用 sharp 生成然后需要额外处理
  // 注意：ICNS 格式复杂，通常使用专门工具生成
  console.log('\n--- ICNS 文件需要额外工具 ---');
  console.log('请使用以下命令生成 ICNS：');
  console.log('  brew install iconutil');
  console.log('  iconutil -c icns src-tauri/icons/icon.iconset');

  console.log('\n所有图标生成完成！');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
