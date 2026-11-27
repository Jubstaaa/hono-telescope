import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

import { alsContext } from '../context/als-context.js'
import { Recorder } from '../recorder.js'
import { memoryStorage } from '../storage/memory-storage.js'
import { exceptionCollector } from './exception-collector.js'

const build = () => {
    const storage = memoryStorage()
    return { recorder: new Recorder(storage, alsContext()), storage }
}

const COLLECTOR = fileURLToPath(
    new URL('./exception-collector.ts', import.meta.url)
)
const RECORDER = fileURLToPath(new URL('../recorder.ts', import.meta.url))
const CONTEXT = fileURLToPath(
    new URL('../context/als-context.ts', import.meta.url)
)
const STORAGE = fileURLToPath(
    new URL('../storage/memory-storage.ts', import.meta.url)
)

function runWithCollector(body: string, nodeOptions?: string) {
    const script = `
    const { exceptionCollector } = await import(${JSON.stringify(COLLECTOR)});
    const { Recorder } = await import(${JSON.stringify(RECORDER)});
    const { alsContext } = await import(${JSON.stringify(CONTEXT)});
    const { memoryStorage } = await import(${JSON.stringify(STORAGE)});
    const storage = memoryStorage();
    exceptionCollector().install(new Recorder(storage, alsContext()));
    ${body}
  `
    const env = { ...process.env, NODE_OPTIONS: nodeOptions ?? '' }

    return spawnSync('bun', ['-e', script], {
        encoding: 'utf-8',
        env,
        timeout: 10_000,
    })
}

describe('exceptionCollector', () => {
    it('leaves an uncaught exception fatal, as it is without Telescope', () => {
        const result = runWithCollector(`
      setTimeout(() => { throw new Error('boom'); }, 0);
      setTimeout(() => console.log('survived'), 200);
    `)

        expect(result.stdout).not.toContain('survived')
        expect(result.status).not.toBe(0)
    })

    it('leaves an unhandled rejection fatal when the app has no handler of its own', () => {
        const result = runWithCollector(`
      Promise.reject(new Error('boom'));
      setTimeout(() => console.log('survived'), 200);
    `)

        expect(result.stdout).not.toContain('survived')
        expect(result.status).not.toBe(0)
    })

    it('stays fatal when a second Telescope instance is listening too', () => {
        const result = runWithCollector(`
      exceptionCollector().install(new Recorder(memoryStorage(), alsContext()));
      Promise.reject(new Error('boom'));
      setTimeout(() => console.log('survived'), 200);
    `)

        expect(result.stdout).not.toContain('survived')
        expect(result.status).not.toBe(0)
    })

    it('respects --unhandled-rejections=warn', () => {
        const result = runWithCollector(
            `
      Promise.reject(new Error('boom'));
      setTimeout(() => console.log('survived'), 200);
    `,
            '--unhandled-rejections=warn'
        )

        expect(result.stdout).toContain('survived')
    })

    it("keeps the app's own rejection handler in charge, and still records the rejection", () => {
        const result = runWithCollector(`
      process.on('unhandledRejection', () => {});
      Promise.reject(new Error('boom'));
      setTimeout(async () => console.log('recorded', await storage.count('exception')), 200);
    `)

        expect(result.stdout).toContain('recorded 1')
        expect(result.status).toBe(0)
    })

    it('records an uncaught exception', async () => {
        const { recorder, storage } = build()
        const before = process.listeners('uncaughtExceptionMonitor')

        const uninstall = exceptionCollector().install(recorder)
        const added = process
            .listeners('uncaughtExceptionMonitor')
            .filter(l => !before.includes(l))
        expect(added).toHaveLength(1)

        ;(added[0] as (error: Error) => void)(new Error('boom'))
        await vi.waitFor(async () => {
            expect(await storage.count('exception')).toBe(1)
        })
        uninstall()

        expect((await storage.list('exception'))[0]).toMatchObject({
            message: 'boom',
        })
    })

    it('records an unhandled rejection, coercing a non-Error reason', async () => {
        const { recorder, storage } = build()
        const before = process.listeners('unhandledRejection')

        const uninstall = exceptionCollector().install(recorder)
        const added = process
            .listeners('unhandledRejection')
            .filter(l => !before.includes(l))
        expect(added).toHaveLength(1)

        added[0]!('nope', Promise.resolve())
        await vi.waitFor(async () => {
            expect(await storage.count('exception')).toBe(1)
        })
        uninstall()

        expect((await storage.list('exception'))[0]!.message).toBe('nope')
    })

    it('removes its listeners on uninstall', () => {
        const { recorder } = build()
        const before = process.listenerCount('uncaughtExceptionMonitor')

        const uninstall = exceptionCollector().install(recorder)
        expect(process.listenerCount('uncaughtExceptionMonitor')).toBe(
            before + 1
        )

        uninstall()
        expect(process.listenerCount('uncaughtExceptionMonitor')).toBe(before)
    })

    it('does not patch console.error', () => {
        const { recorder } = build()
        const original = console.error

        const uninstall = exceptionCollector().install(recorder)
        expect(console.error).toBe(original)

        uninstall()
    })
})
