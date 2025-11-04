#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const src480 = path.resolve(__dirname, '../public/me-480.png');
const src960 = path.resolve(__dirname, '../public/me-960.png');

async function run() {
  try {
    await sharp(src480)
      .webp({ quality: 80 })
      .toFile(path.resolve(__dirname, '../public/me-480.webp'));
    console.log('Created public/me-480.webp');

    await sharp(src960)
      .webp({ quality: 80 })
      .toFile(path.resolve(__dirname, '../public/me-960.webp'));
    console.log('Created public/me-960.webp');

    // Also create a smaller PNG-optimized copy for fallback
    await sharp(src480)
      .png({ compressionLevel: 9, quality: 80 })
      .toFile(path.resolve(__dirname, '../public/me-480.opt.png'));
    console.log('Created public/me-480.opt.png');

    console.log('All done');
  } catch (err) {
    console.error('Error during image optimization:', err);
    process.exit(1);
  }
}

run();
