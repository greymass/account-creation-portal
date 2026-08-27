import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const legacyProviderName = ['send', 'grid'].join('');

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath];
    })
  );
  return files.flat();
}

for (const file of await sourceFiles(fileURLToPath(new URL('../src', import.meta.url)))) {
  const source = await readFile(file, 'utf8');
  assert.doesNotMatch(source, new RegExp(legacyProviderName, 'i'), `${file} uses legacy email code`);
}

console.log('Email provider source audit passed');
