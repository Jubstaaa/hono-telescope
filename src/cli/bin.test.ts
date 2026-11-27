import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('package bin', () => {
    it('points at the compiled cli entry that publishBuild keeps', () => {
        const pkg = JSON.parse(
            readFileSync(
                new URL('../../package.json', import.meta.url),
                'utf-8'
            )
        ) as { bin: Record<string, string>; files: string[] }

        expect(pkg.bin).toEqual({ 'hono-telescope': './dist/cli/index.js' })
        expect(pkg.files).toContain('dist')
    })

    it('resolves every export for require() as well as import', () => {
        const pkg = JSON.parse(
            readFileSync(
                new URL('../../package.json', import.meta.url),
                'utf-8'
            )
        ) as { exports: Record<string, { default?: string; import: string }> }

        for (const target of Object.values(pkg.exports)) {
            expect(target.default).toBe(target.import)
        }
    })

    it('declares vitest, which the ./testing export imports, as an optional peer', () => {
        const pkg = JSON.parse(
            readFileSync(
                new URL('../../package.json', import.meta.url),
                'utf-8'
            )
        ) as {
            peerDependencies: Record<string, string>
            peerDependenciesMeta: Record<string, { optional?: boolean }>
        }

        expect(pkg.peerDependencies.vitest).toBeDefined()
        expect(pkg.peerDependenciesMeta.vitest!.optional).toBe(true)
    })
})
