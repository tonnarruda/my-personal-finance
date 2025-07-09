const https = require('https');

const BACKEND_URL = process.env.REACT_APP_API_BASE_URL ? 
  process.env.REACT_APP_API_BASE_URL.replace('/api', '/health') : 
  'https://my-personal-finance.onrender.com/health';
const INTERVAL_MS = 60000; // 1 minuto

function pingBackend() {
  const req = https.get(BACKEND_URL, (res) => {
    console.log(`[${new Date().toISOString()}] Health check: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`[${new Date().toISOString()}] Response:`, response.message || 'OK');
      } catch (e) {
        console.log(`[${new Date().toISOString()}] Raw response:`, data);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Error pinging backend:`, err.message);
  });

  req.setTimeout(10000, () => {
    console.error(`[${new Date().toISOString()}] Request timeout`);
    req.destroy();
  });
}

console.log(`🚀 Starting keep-alive service for ${BACKEND_URL}`);
console.log(`⏰ Interval: ${INTERVAL_MS / 1000} seconds`);
console.log(`📅 Started at: ${new Date().toISOString()}`);

// Primeira chamada imediata
pingBackend();

// Configurar intervalo
setInterval(pingBackend, INTERVAL_MS);

// Tratamento de graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down keep-alive service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down keep-alive service...');
  process.exit(0);
}); 