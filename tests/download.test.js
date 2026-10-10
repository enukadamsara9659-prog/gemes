import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { createSourceArchive, DOWNLOAD_NAME } from '../scripts/package-download.mjs';

test('download is a real ZIP with runnable source, assets and packaging scripts', () => {
  const bytes = createSourceArchive();
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  const files = unzipSync(bytes);
  for (const name of ['package.json', 'README.md', 'index.html', 'src/main.js', 'public/assets/soldier.glb', 'scripts/package-download.mjs', 'vite.config.js']) assert.ok(files[`DROPZONE/${name}`], `missing ${name}`);
  assert.ok(Object.keys(files).every(name => !/node_modules|\.git\/|\/downloads\/|\/dist\//.test(name)));
  assert.ok(!Object.keys(files).some(name => name.endsWith('.zip')));
  assert.ok(strFromU8(files['DROPZONE/src/main.js']).includes(`download="${DOWNLOAD_NAME}"`));
  assert.ok(JSON.parse(strFromU8(files['DROPZONE/package.json'])).scripts.predev);
});
