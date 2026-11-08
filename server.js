import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 8000;
const ROOT = fileURLToPath(new URL('./dist/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.hbs': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
};

http
  .createServer((request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    let file = path.join(ROOT, decodeURIComponent(pathname));

    if (!file.startsWith(ROOT) || file.includes(`${path.sep}node_modules${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    if (!path.extname(file)) file = path.join(ROOT, 'index.html');
    fs.readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      response.end(data);
    });
  })
  .listen(PORT, () => console.log(`Frame: http://localhost:${PORT}`));
