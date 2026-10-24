import { cp, mkdir, readFile, writeFile, readdir, lstat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.resolve(root, '../public');
const dist = path.resolve(root, 'dist');
const runtime = path.resolve(root, 'runtime');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function verifyPublic(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    if ((await lstat(name)).isSymbolicLink()) throw new Error('Public symlinks are not allowed');
    if (/^\.(?:env|git)|\.(?:pem|key)$/i.test(entry.name)) throw new Error('Private file in public assets');
    if (entry.isDirectory()) await verifyPublic(name);
  }
}
function chunkPath(name) {
  const target = path.resolve(publicRoot, name);
  if (!target.startsWith(publicRoot + path.sep)) throw new Error('Invalid data chunk path');
  return target;
}

await verifyPublic(publicRoot);
const manifest = JSON.parse(await readFile(path.join(publicRoot, 'jobs.json'), 'utf8'));
if (!Array.isArray(manifest.chunks) || !manifest.chunks.length) throw new Error('Missing data manifest');
let rows = 0;
for (const chunk of manifest.chunks) {
  const plain = await readFile(chunkPath(chunk.jsonPath));
  const uncompressed = gunzipSync(await readFile(chunkPath(chunk.gzipPath)));
  if (hash(plain) !== chunk.sha256 || !plain.equals(uncompressed)) throw new Error('Data integrity failed: ' + chunk.jsonPath);
  const records = JSON.parse(plain);
  if (!Array.isArray(records) || records.length !== chunk.rowCount) throw new Error('Data count mismatch');
  rows += records.length;
}
if (rows !== manifest.rowCount || rows !== manifest.sampling.sampleCount) throw new Error('Total data count mismatch');

// Only rebuild this project's generated dist directory. Never touch the source.
if (path.dirname(dist) !== path.resolve(root) || path.basename(dist) !== 'dist') throw new Error('Unsafe output directory');
try {
  if ((await lstat(dist)).isSymbolicLink()) throw new Error('Output must not be a symlink');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await rm(dist, { recursive: true, force: true });
await cp(publicRoot, dist, { recursive: true });
await mkdir(runtime, { recursive: true });
const server = await readFile(path.resolve(root, '../lib/research-server.mjs'));
await writeFile(path.join(runtime, 'research-server.mjs'), server);
console.log(`Makers build verified: ${manifest.chunks.length} chunks, ${rows} records; static assets and research runtime ready.`);
