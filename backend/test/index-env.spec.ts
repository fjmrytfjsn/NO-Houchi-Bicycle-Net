import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('backend entrypoint environment loading', () => {
  it('preloads dotenv before creating the server', () => {
    const source = readFileSync(resolve(__dirname, '../src/index.ts'), 'utf8');
    const firstImport = source
      .split('\n')
      .find((line) => line.trim().startsWith('import'));

    expect(firstImport).toBe("import 'dotenv/config';");
  });
});
