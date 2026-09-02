import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('package bin', () => {
  it('points at the compiled cli entry that publishBuild keeps', () => {
    // Read, not imported: importing package.json makes it a TypeScript program input, and
    // importing the entry itself would run the cli against vitest's own argv.
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
    ) as { bin: Record<string, string>; files: string[] };

    expect(pkg.bin).toEqual({ 'hono-telescope': './dist/cli/index.js' });
    expect(pkg.files).toContain('dist');
  });
});
