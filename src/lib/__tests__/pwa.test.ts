import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const publicDir = resolve(repoRoot, 'public');
const readPublicText = (name: string) =>
  readFileSync(resolve(publicDir, name), 'utf8');

function pngDimensions(fileName: string): { width: number; height: number } {
  const bytes = readFileSync(resolve(publicDir, fileName));
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  expect(bytes.subarray(0, 8)).toEqual(pngSignature);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

describe('CardNurture PWA packaging', () => {
  it('publishes complete install metadata and icon purposes', () => {
    const manifest = JSON.parse(readPublicText('manifest.json')) as {
      name?: string;
      short_name?: string;
      id?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      orientation?: string;
      theme_color?: string;
      background_color?: string;
      icons?: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };

    expect(manifest.name).toBe('CardNurture');
    expect(manifest.short_name).toBe('CardNurture');
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.theme_color).toBe('#0F1117');
    expect(manifest.background_color).toBe('#0F1117');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }),
      ]),
    );
  });

  it('ships real PNGs at the dimensions advertised to browsers', () => {
    const expectedDimensions: Record<string, number> = {
      'icon-192.png': 192,
      'icon-512.png': 512,
      'icon-512-maskable.png': 512,
      'apple-touch-icon.png': 180,
    };

    for (const [fileName, dimension] of Object.entries(expectedDimensions)) {
      expect(existsSync(resolve(publicDir, fileName))).toBe(true);
      expect(pngDimensions(fileName)).toEqual({
        width: dimension,
        height: dimension,
      });
    }
  });

  it('uses a shell-only service worker without caching API requests', () => {
    const worker = readPublicText('sw.js');

    expect(worker).toMatch(/addEventListener\(['"]install['"]/);
    expect(worker).toMatch(/addEventListener\(['"]activate['"]/);
    expect(worker).toMatch(/addEventListener\(['"]fetch['"]/);
    expect(worker).toMatch(/\/api\//);
    expect(worker).toMatch(/request\.method\s*!==\s*['"]GET['"]|request\.method\s*===\s*['"]GET['"]/);
    expect(worker).toMatch(/same-origin|url\.origin/);
    expect(worker).toMatch(/credentials\s*===\s*['"]include['"]|credentials\s*!==\s*['"]include['"]|credentials\s*!==\s*['"]same-origin['"]/);
  });

  it('registers the worker and keeps mobile viewport zoom accessible', () => {
    const layout = readFileSync(resolve(repoRoot, 'src/app/layout.tsx'), 'utf8');
    const styles = readFileSync(resolve(repoRoot, 'src/app/globals.css'), 'utf8');

    expect(layout).toContain('ServiceWorkerRegistration');
    expect(layout).toContain("viewportFit: 'cover'");
    expect(layout).not.toContain('maximumScale');
    expect(styles).toContain('safe-area-inset-bottom');
    expect(styles).toContain('safe-area-inset-top');
  });
});
