import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import onRequest from '../cloud-functions/api/research/[action].js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 8788);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.gz': 'application/gzip' };

const server = http.createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith('/api/research/')) {
      const controller = new AbortController();
      outgoing.on('close', () => { if (!outgoing.writableEnded) controller.abort(); });
      const init = { method: incoming.method, headers: incoming.headers, signal: controller.signal };
      if (!['GET', 'HEAD'].includes(incoming.method)) {
        init.body = incoming;
        init.duplex = 'half';
      }
      const response = await onRequest({ request: new Request(url, init), env: process.env });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (!['GET', 'HEAD'].includes(incoming.method)) {
      outgoing.writeHead(405); outgoing.end(); return;
    }
    const name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const target = path.resolve(root, '.' + name);
    if (!target.startsWith(path.resolve(root) + path.sep) || /(^|[\\/])\./.test(name)) {
      outgoing.writeHead(404); outgoing.end(); return;
    }
    if (!(await stat(target)).isFile()) throw new Error('Not found');
    const data = await readFile(target);
    outgoing.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream' });
    outgoing.end(incoming.method === 'HEAD' ? undefined : data);
  } catch {
    if (!outgoing.headersSent) outgoing.writeHead(404);
    outgoing.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Makers local preview: http://127.0.0.1:${port}`));
