import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DASHBOARD_DIR = join(HERE, '..', 'src', 'core', 'dashboard');
const ASSETS_DIR = join(DASHBOARD_DIR, 'assets');
const OUTPUT = join(HERE, '..', 'src', 'core', 'hono', 'dashboard-assets.ts');

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const contentTypeOf = (file: string): string => {
  const extension = file.slice(file.lastIndexOf('.'));
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
};

const html = readFileSync(join(DASHBOARD_DIR, 'index.html'), 'utf-8');

const assets = readdirSync(ASSETS_DIR).map((file) => ({
  file,
  contentType: contentTypeOf(file),
  body: readFileSync(join(ASSETS_DIR, file), 'utf-8'),
}));

const entries = assets
  .map(
    (asset) =>
      `  ${JSON.stringify(asset.file)}: {\n` +
      `    contentType: ${JSON.stringify(asset.contentType)},\n` +
      `    body: ${JSON.stringify(asset.body)},\n` +
      `  },`
  )
  .join('\n');

writeFileSync(
  OUTPUT,
  `// GENERATED FILE — do not edit. Produced by scripts/inline-assets.ts during build.\n` +
    `export const DASHBOARD_HTML = ${JSON.stringify(html)};\n\n` +
    `export interface DashboardAsset {\n  contentType: string;\n  body: string;\n}\n\n` +
    `export const DASHBOARD_ASSETS: Record<string, DashboardAsset> = {\n${entries}\n};\n`,
  'utf-8'
);

console.log(`Inlined ${assets.length} dashboard assets into ${OUTPUT}`);
