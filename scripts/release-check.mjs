await import('./check-licensing.mjs');
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { createGrinch } from '../dist/index.js';
const p = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(p.name, '@fluritheme/grinch');
assert.equal(Object.keys(p.dependencies ?? {}).length, 0);
const files = await readdir('dist');
let bytes = 0;
for (const file of files.filter((f) => f.endsWith('.js')))
  bytes += gzipSync(await readFile(`dist/${file}`)).length;
assert.ok(bytes < 30000, `Runtime budget exceeded: ${bytes}`);
for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md'])
  assert.ok((await readFile(file, 'utf8')).trim().length > 100);
const g = createGrinch();
assert.equal(g.getState().state, 'idle');
g.destroy();
assert.equal(g.getState().state, 'destroyed');
console.log(
  `${p.name}@${p.version}: SSR import, package metadata and zero dependencies verified; ${bytes} bytes gzip across runtime modules.`,
);
