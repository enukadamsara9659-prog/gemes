import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

export const DOWNLOAD_NAME = 'DROPZONE-source.zip';
export const DOWNLOAD_URL = `/downloads/${DOWNLOAD_NAME}`;
const root = fileURLToPath(new URL('../', import.meta.url));

export function createSourceArchive(base = root) {
  const files = {};
  const addFile = path => { files[`DROPZONE/${relative(base, path).replaceAll('\\', '/')}`] = new Uint8Array(readFileSync(path)); };
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      // Generated downloads must never include themselves, or dependencies/secrets.
      if (['downloads', 'node_modules', 'dist', '.git'].includes(entry.name) || entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && !entry.name.endsWith('.zip')) addFile(path);
    }
  };
  for (const name of ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'README.md', 'ASSETS.md', 'THIRD_PARTY_LICENSE.txt', '.gitignore']) addFile(join(base, name));
  for (const dir of ['src', 'public', 'scripts', 'tests']) walk(join(base, dir));
  return zipSync(files, { level: 6 });
}

export function packageDownload() {
  const directory = join(root, 'public', 'downloads');
  mkdirSync(directory, { recursive: true });
  const archive = createSourceArchive();
  writeFileSync(join(directory, DOWNLOAD_NAME), archive);
  console.log(`Download ready: ${DOWNLOAD_NAME} (${(archive.length / 1024).toFixed(0)} KB)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) packageDownload();
