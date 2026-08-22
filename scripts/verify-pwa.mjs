#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicDir = resolve(repoRoot, 'public');
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(fileName) {
  try {
    return JSON.parse(readFileSync(resolve(publicDir, fileName), 'utf8'));
  } catch (error) {
    fail(`${fileName}: ${error.message}`);
    return null;
  }
}

function readText(fileName) {
  try {
    return readFileSync(resolve(repoRoot, fileName), 'utf8');
  } catch (error) {
    fail(`${fileName}: ${error.message}`);
    return '';
  }
}

function pngDimensions(fileName) {
  const filePath = resolve(publicDir, fileName);
  if (!existsSync(filePath)) {
    fail(`${fileName}: file is missing`);
    return null;
  }

  const bytes = readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
    fail(`${fileName}: not a valid PNG`);
    return null;
  }

  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const manifest = readJson('manifest.json');
if (manifest) {
  for (const [key, expected] of Object.entries({
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0F1117',
    background_color: '#0F1117',
  })) {
    if (manifest[key] !== expected) {
      fail(`manifest.${key}: expected ${JSON.stringify(expected)}`);
    }
  }

  if (manifest.name !== 'CardNurture' || manifest.short_name !== 'CardNurture') {
    fail('manifest: name and short_name must be CardNurture');
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const requiredIcons = [
    ['/icon-192.png', '192x192', 'any'],
    ['/icon-512.png', '512x512', 'any'],
    ['/icon-512-maskable.png', '512x512', 'maskable'],
  ];
  for (const [src, sizes, purpose] of requiredIcons) {
    if (!icons.some((icon) =>
      icon.src === src &&
      icon.sizes === sizes &&
      icon.type === 'image/png' &&
      icon.purpose === purpose
    )) {
      fail(`manifest.icons: missing ${src} (${purpose})`);
    }
  }
}

const expectedImages = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-512-maskable.png', 512],
  ['apple-touch-icon.png', 180],
];
for (const [fileName, expectedDimension] of expectedImages) {
  const dimensions = pngDimensions(fileName);
  if (dimensions && (dimensions.width !== expectedDimension || dimensions.height !== expectedDimension)) {
    fail(`${fileName}: expected ${expectedDimension}x${expectedDimension}, got ${dimensions.width}x${dimensions.height}`);
  }
}

const worker = readText('public/sw.js');
for (const marker of [
  "addEventListener('install'",
  "addEventListener('activate'",
  "addEventListener('fetch'",
  "startsWith('/api/')",
  "credentials: 'omit'",
]) {
  if (!worker.includes(marker)) {
    fail(`public/sw.js: missing ${marker}`);
  }
}
if (worker.includes("cache.put(new Request('/api/")) {
  fail('public/sw.js: API responses must never be cached');
}

const layout = readText('src/app/layout.tsx');
if (!layout.includes('ServiceWorkerRegistration')) {
  fail('src/app/layout.tsx: service worker registration is not mounted');
}
if (!layout.includes("viewportFit: 'cover'")) {
  fail("src/app/layout.tsx: viewportFit must be 'cover'");
}
if (layout.includes('maximumScale')) {
  fail('src/app/layout.tsx: maximumScale disables accessible zoom');
}
if (!layout.includes('/apple-touch-icon.png')) {
  fail('src/app/layout.tsx: Apple touch icon metadata is missing');
}

if (failures.length > 0) {
  console.error('pwa verification: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('icons=PASS');
  console.log('pwa verification: PASS');
}
