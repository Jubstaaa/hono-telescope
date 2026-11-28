import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const OUTPUT = join(ROOT, 'src', 'core', 'version.ts')

const pkg: unknown = JSON.parse(
    readFileSync(join(ROOT, 'package.json'), 'utf-8')
)

const version =
    typeof pkg === 'object' &&
    pkg !== null &&
    'version' in pkg &&
    typeof pkg.version === 'string'
        ? pkg.version
        : ''

if (version.length === 0) {
    throw new Error('package.json has no version to inline')
}

writeFileSync(
    OUTPUT,
    `export const TELESCOPE_VERSION = ${JSON.stringify(version)}\n`,
    'utf-8'
)

console.log(`Inlined version ${version} into ${OUTPUT}`)
