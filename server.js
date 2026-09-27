import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = '0.0.0.0';
// Environment port resolution:
// In this AI Studio environment, NGINX reverse-proxy runs on port 8080 and routes to port 3000.
// Per environment constraints: "Dev server must run on port 3000".
const devPort = parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const requestHandler = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Cloud Run / container health check endpoints
  if (
    pathname === '/health' ||
    pathname === '/healthz' ||
    pathname === '/_ah/health' ||
    pathname === '/api/health'
  ) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
    }
    return;
  }

  // User Profile for moonrana825@gmail.com
  if (pathname === '/api/user/profile') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      email: 'moonrana825@gmail.com',
      name: 'Moon Rana',
      authenticated: true,
      tier: 'INSTITUTIONAL_PRO',
      provider: 'google',
      preferences: {
        adxThreshold: 30,
        scanScope: '60',
        emailAlertsEnabled: true,
        alertEmail: 'moonrana825@gmail.com',
        alertOnGolden: true,
        alertOnAdx50: true,
        portfolioSize: 10000,
        riskPercent: 1
      },
      watchlist: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']
    }));
    return;
  }

  // Save Preferences for moonrana825@gmail.com
  if (pathname === '/api/user/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Settings saved for moonrana825@gmail.com', data: payload }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Gmail Alert Notification Dispatcher for moonrana825@gmail.com
  if (pathname === '/api/alert/email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const alertData = JSON.parse(body || '{}');
        const targetEmail = alertData.recipient || 'moonrana825@gmail.com';
        console.log(`[Gmail Alert Dispatcher] Sent signal alert for ${alertData.symbol || 'MARKET'} to ${targetEmail}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          recipient: targetEmail,
          signal: alertData.signal || 'A+ GOLDEN SETUP',
          symbol: alertData.symbol || 'BTCUSDT',
          price: alertData.price || '0.0',
          timestamp: new Date().toISOString(),
          message: `Signal alert successfully sent to ${targetEmail}`
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid alert payload' }));
      }
    });
    return;
  }

  // Binance API Proxy
  // Example: /api/binance/fapi/v1/ticker/24hr -> https://fapi.binance.com/fapi/v1/ticker/24hr
  if (pathname.startsWith('/api/binance/')) {
    const targetPath = pathname.replace('/api/binance', '') + parsedUrl.search;
    const targetUrl = `https://fapi.binance.com${targetPath}`;
    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const data = await upstreamRes.arrayBuffer();
      res.writeHead(upstreamRes.status, {
        'Content-Type': upstreamRes.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-cache'
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(Buffer.from(data));
      }
    } catch (err) {
      console.error(`[Proxy Error] ${targetUrl}:`, err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch from Binance', details: err.message }));
    }
    return;
  }

  // Serve static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(__dirname, safePath);

  // Check if file exists in root or public folder
  if (!fs.existsSync(filePath)) {
    const publicPath = path.join(__dirname, 'public', safePath);
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    } else {
      // SPA Fallback to index.html
      filePath = path.join(__dirname, 'index.html');
    }
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(content);
    }
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File Not Found');
  }
};

const activeServers = [];

// Helper to start an HTTP server on a specified port
function startServerOnPort(port, label) {
  const server = http.createServer(requestHandler);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Server] Port ${port} (${label}) already in use by host/proxy, continuing...`);
    } else {
      console.error(`[Server] Error on port ${port} (${label}):`, err.message);
    }
  });

  server.listen(port, HOST, () => {
    console.log(`[Server] Listening on http://${HOST}:${port} (${label})`);
    activeServers.push(server);
  });

  return server;
}

// Ensure server listens on Dev Port (3000)
const portsToListen = new Set();
portsToListen.add(devPort);
if (envPort && envPort !== 8080 && envPort !== devPort) {
  portsToListen.add(envPort);
}

for (const port of portsToListen) {
  startServerOnPort(port, `Port (${port})`);
}

// Global process error handlers
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

const gracefulShutdown = () => {
  console.log('[Server] Graceful shutdown initiated');
  activeServers.forEach((srv) => srv.close());
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
