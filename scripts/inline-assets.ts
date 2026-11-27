import { getMimeType } from 'hono/utils/mime'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const DASHBOARD_DIR = join(HERE, '..', 'src', 'core', 'dashboard')
const ASSETS_DIR = join(DASHBOARD_DIR, 'assets')
const OUTPUT = join(HERE, '..', 'src', 'core', 'hono', 'dashboard-assets.ts')

const html = readFileSync(join(DASHBOARD_DIR, 'index.html'), 'utf-8')

if (html.trim().length === 0) {
    throw new Error(`dashboard HTML at ${DASHBOARD_DIR} is empty`)
}

const assets = readdirSync(ASSETS_DIR).map(file => ({
    body: readFileSync(join(ASSETS_DIR, file), 'utf-8'),
    contentType: getMimeType(file) ?? 'application/octet-stream',
    file,
}))

if (assets.length === 0) {
    throw new Error(
        `no dashboard assets found in ${ASSETS_DIR} — did the Vite build run?`
    )
}

const entries = assets
    .map(
        asset =>
            `  ${JSON.stringify(asset.file)}: {\n` +
            `    contentType: ${JSON.stringify(asset.contentType)},\n` +
            `    body: ${JSON.stringify(asset.body)},\n` +
            `  },`
    )
    .join('\n')

writeFileSync(
    OUTPUT,
    `// GENERATED FILE — do not edit. Produced by scripts/inline-assets.ts during build.\n` +
        `export const DASHBOARD_HTML = ${JSON.stringify(html)};\n\n` +
        `export interface DashboardAsset {\n  contentType: string;\n  body: string;\n}\n\n` +
        `export const DASHBOARD_ASSETS: Record<string, DashboardAsset> = {\n${entries}\n};\n`,
    'utf-8'
)

console.log(`Inlined ${assets.length} dashboard assets into ${OUTPUT}`)
