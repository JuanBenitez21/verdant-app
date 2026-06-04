#!/usr/bin/env node
/**
 * Genera icon.png, splash.png y adaptive-icon.png desde el SVG del ícono.
 * Uso: node scripts/generate-assets.js
 * Requiere: pnpm add -D sharp
 */
const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '../assets');
const BG = '#1e5435';
const GREEN = '#5ec287';

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="220" fill="${BG}"/>
  <text x="512" y="680" font-family="Georgia,serif" font-size="580" text-anchor="middle" fill="${GREEN}">v</text>
</svg>`;

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <rect width="1284" height="2778" fill="${BG}"/>
  <text x="642" y="1470" font-family="Georgia,serif" font-size="120" text-anchor="middle" fill="#ffffff" letter-spacing="4">verdant</text>
</svg>`;

async function run() {
  await sharp(Buffer.from(iconSvg)).resize(1024,1024).png().toFile(path.join(ASSETS,'icon.png'));
  console.log('✓ icon.png');
  await sharp(Buffer.from(iconSvg)).resize(1024,1024).png().toFile(path.join(ASSETS,'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');
  await sharp(Buffer.from(splashSvg)).resize(1284,2778).png().toFile(path.join(ASSETS,'splash.png'));
  console.log('✓ splash.png');
  console.log('Assets generados en', ASSETS);
}

run().catch(e => { console.error('Error:', e.message, '\n¿Instalaste sharp? → pnpm add -D sharp'); process.exit(1); });
