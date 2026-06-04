// Dependency-free static SPA server (pure Node built-ins).
//
// Previously used Express, but the Express 5 -> qs -> side-channel dependency chain
// repeatedly failed to resolve at runtime under pnpm in the Docker image
// (MODULE_NOT_FOUND). Serving the built SPA needs only static files + an index.html
// fallback, so we use the Node `http` module with zero runtime dependencies.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const INDEX = path.join(DIST, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const noCache = (res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

// Hashed Vite assets (e.g. app.4f3a9c1b.js) are content-addressed -> cache long-term.
const isHashed = (p) => /\.[a-f0-9]{8,}\./.test(p);

function sendFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = status;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (filePath.endsWith('index.html')) {
    noCache(res);
  } else if (isHashed(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  fs.createReadStream(filePath).on('error', () => {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (urlPath === '/health' || urlPath === '/healthz') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'healthy', service: 'erp-ui', timestamp: new Date().toISOString() }));
    return;
  }

  // Resolve the requested path within DIST, guarding against path traversal.
  const safe = path.normalize(path.join(DIST, urlPath));
  if (!safe.startsWith(DIST)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(safe, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, safe);
    } else {
      // SPA fallback -> index.html (client-side routing handles the path)
      sendFile(res, INDEX);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ERP UI Server (pure-node) running on port ${PORT}`);
});
