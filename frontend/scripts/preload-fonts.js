const fs = require('node:fs');
const path = require('node:path');

const buildDir = path.resolve(process.cwd(), process.env.BUILD_PATH || 'build');
const manifest = JSON.parse(fs.readFileSync(path.join(buildDir, 'asset-manifest.json'), 'utf8'));
const indexPath = path.join(buildDir, 'index.html');
const fontFiles = ['google-sans-georgian.woff2', 'google-sans-latin.woff2'];

const links = fontFiles.map((file) => {
  const url = manifest.files[`static/media/${file}`];
  if (!url) throw new Error(`Missing built font asset: ${file}`);
  return `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin="anonymous">`;
}).join('');

const html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('<head>')) throw new Error('Built index.html is missing <head>');
fs.writeFileSync(indexPath, html.replace('<head>', `<head>${links}`));
