const { createServer, request: httpRequest } = require('node:http');
const { request: httpsRequest } = require('node:https');
const { createReadStream, existsSync } = require('node:fs');
const { stat } = require('node:fs/promises');
const path = require('node:path');

const port = Number(process.env.PORT) || 8000;
const root = path.join(__dirname, 'dist');
const index = path.join(root, 'index.html');
const backend = new URL(process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080');
const proxyRequest = backend.protocol === 'https:' ? httpsRequest : httpRequest;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

if (!existsSync(index)) {
  console.error('Сначала соберите приложение: npm run build');
  process.exit(1);
}

function proxy(req, res, pathname, search) {
  const upstream = proxyRequest(new URL(backend.origin), {
    path: pathname + search,
    method: req.method,
    headers: { ...req.headers, host: backend.host },
  }, (response) => {
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => {
    if (res.headersSent) res.destroy();
    else res.writeHead(502, { 'Content-Type': types['.json'] }).end('{"error":"API unavailable"}');
  });
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
}

createServer(async (req, res) => {
  let url;
  let pathname;
  try {
    url = new URL(req.url, 'http://localhost');
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (/^\/(api|static|avatars)(\/|$)/.test(pathname)) {
    proxy(req, res, url.pathname, url.search);
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const file = path.extname(pathname) ? path.resolve(root, '.' + pathname) : index;
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (!(await stat(file)).isFile()) {
      res.writeHead(404).end();
      return;
    }
  } catch {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': types[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).on('error', () => res.destroy()).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Frame: http://localhost:${port}`));
