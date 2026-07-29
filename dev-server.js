// Local-only dev server. Not used by Vercel in production.
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// load .env.local
const envPath = path.join(__dirname, '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const tasksHandler = require('./api/tasks.js');

function wrapRes(rawRes) {
  rawRes.status = function (code) { this.statusCode = code; return this; };
  rawRes.json = function (obj) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(obj));
  };
  return rawRes;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  wrapRes(res);

  if (parsed.pathname === '/api/tasks') {
    req.query = parsed.query;
    let chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      tasksHandler(req, res);
    });
    return;
  }

  // static files
  let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  filePath = path.join(__dirname, filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    const ext = path.extname(filePath);
    const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : 'text/plain';
    res.setHeader('Content-Type', type);
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Dev server running at http://localhost:${PORT}`));
