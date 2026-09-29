import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createInquiryHandler } from './inquiries.js';

const handler = createInquiryHandler();
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = createServer(async (req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/healthz' && ['GET','HEAD'].includes(req.method)) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ok: true }));
  }
  if (pathname === '/api/inquiries') return handler(req,res);
  if (pathname.startsWith('/api/')) { res.writeHead(404); return res.end(); }
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  try {
    let file = resolve(root, `.${decodeURIComponent(pathname)}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    try { if (!(await stat(file)).isFile()) file = resolve(root,'index.html'); }
    catch { if (extname(pathname)) { res.writeHead(404); return res.end(); } file = resolve(root,'index.html'); }
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(500); res.end(); }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'), () => console.log('Open World Aviation server ready.'));

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
});
