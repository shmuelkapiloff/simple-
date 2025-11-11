#!/usr/bin/env node

/**
 * 🔍 TechBasket Health Check Tool
 * בודק את כל נקודות הקצה ומדווח על מצב המערכת
 */

const http = require('http');
const https = require('https');

// הגדרות
const config = {
  server: {
    host: 'localhost',
    port: 3000,
    timeout: 5000
  },
  client: {
    host: 'localhost', 
    port: 5173,
    timeout: 3000
  }
};

// צבעים לטרמינל
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// פונקציית בקשה HTTP
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(options.timeout || 5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// בדיקת נקודת קצה בודדת
async function checkEndpoint(name, options, expectedStatus = 200) {
  try {
    const result = await makeRequest(options);
    const success = expectedStatus ? result.status === expectedStatus : result.success;
    
    console.log(
      `  ${success ? colors.green + '✅' : colors.red + '❌'} ${name}: ` +
      `${success ? colors.green : colors.red}${result.status}${colors.reset}`
    );
    
    return { name, success, status: result.status, data: result.data };
  } catch (error) {
    console.log(`  ${colors.red}❌ ${name}: ERROR - ${error.message}${colors.reset}`);
    return { name, success: false, error: error.message };
  }
}

// בדיקת חיבור בסיסי
async function checkConnection(host, port, service) {
  return new Promise((resolve) => {
    const socket = require('net').createConnection(port, host);
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// נקודות קצה לבדיקה
const endpoints = [
  // בדיקות בריאות
  {
    name: 'Health Check - Basic',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/health',
      method: 'GET',
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Health Check - Detailed',
    options: {
      hostname: config.server.host,
      port: config.server.port, 
      path: '/api/health/detailed',
      method: 'GET',
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },

  // בדיקות מוצרים
  {
    name: 'Products - Get All',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/products',
      method: 'GET',
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Products - Get Single (ID: 1)',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/products/1',
      method: 'GET',
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Products - Invalid ID',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/products/999999',
      method: 'GET',
      timeout: config.server.timeout
    },
    expectedStatus: 404
  },

  // בדיקות עגלה
  {
    name: 'Cart - Get Cart',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/cart?sessionId=test-session-123',
      method: 'GET',
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Cart - Add Item',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/cart/add',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'health-check-session',
        productId: '1',
        quantity: 2
      }),
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Cart - Update Quantity',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/cart/update',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'health-check-session',
        productId: '1',
        quantity: 3
      }),
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Cart - Remove Item',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/cart/remove',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'health-check-session',
        productId: '1'
      }),
      timeout: config.server.timeout
    },
    expectedStatus: 200
  },
  {
    name: 'Cart - Clear Cart',
    options: {
      hostname: config.server.host,
      port: config.server.port,
      path: '/api/cart/clear',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'health-check-session'
      }),
      timeout: config.server.timeout
    },
    expectedStatus: 200
  }
];

// פונקציה ראשית
async function runHealthCheck() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('🔍 TechBasket Health Check');
  console.log('='.repeat(50));
  console.log(colors.reset);

  // 1. בדיקת חיבור לשרתים
  console.log(`${colors.blue}📡 בדיקת חיבור לשרתים:${colors.reset}`);
  
  const serverConnection = await checkConnection(config.server.host, config.server.port, 'Server');
  console.log(
    `  ${serverConnection ? colors.green + '✅' : colors.red + '❌'} ` +
    `Server (${config.server.host}:${config.server.port}): ` +
    `${serverConnection ? colors.green + 'Connected' : colors.red + 'Not Connected'}${colors.reset}`
  );

  const clientConnection = await checkConnection(config.client.host, config.client.port, 'Client');
  console.log(
    `  ${clientConnection ? colors.green + '✅' : colors.red + '❌'} ` +
    `Client (${config.client.host}:${config.client.port}): ` +
    `${clientConnection ? colors.green + 'Connected' : colors.red + 'Not Connected'}${colors.reset}`
  );

  console.log();

  if (!serverConnection) {
    console.log(`${colors.red}❌ השרת לא זמין. וודא ש:${colors.reset}`);
    console.log(`   1. השרת רץ על ${config.server.host}:${config.server.port}`);
    console.log(`   2. הפעל: cd server && npm run dev`);
    console.log(`   3. MongoDB ו-Redis פועלים`);
    return;
  }

  // 2. בדיקת נקודות קצה
  console.log(`${colors.blue}🔍 בדיקת API Endpoints:${colors.reset}`);
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint.name, endpoint.options, endpoint.expectedStatus);
    results.push(result);
    
    // הפסקה קטנה בין בקשות
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log();

  // 3. סיכום
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = ((successful / total) * 100).toFixed(1);

  console.log(`${colors.blue}📊 סיכום:${colors.reset}`);
  console.log(`  ${colors.green}✅ עובדים: ${successful}/${total} (${successRate}%)${colors.reset}`);
  console.log(`  ${colors.red}❌ לא עובדים: ${total - successful}/${total}${colors.reset}`);

  if (successful === total) {
    console.log(`${colors.green}🎉 כל המערכת תקינה ומוכנה לשימוש!${colors.reset}`);
  } else if (successful > total * 0.8) {
    console.log(`${colors.yellow}⚠️ המערכת עובדת, יש כמה בעיות קלות${colors.reset}`);
  } else {
    console.log(`${colors.red}🚨 יש בעיות משמעותיות במערכת${colors.reset}`);
  }

  console.log();
  console.log(`${colors.blue}💡 טיפים:${colors.reset}`);
  console.log(`   • בדיקת כניסה לאתר: http://${config.client.host}:${config.client.port}`);
  console.log(`   • בדיקת API ישירות: http://${config.server.host}:${config.server.port}/api/health`);
  console.log(`   • Postman collection: server/postman/collection.json`);
  console.log();
}

// הרצה
if (require.main === module) {
  runHealthCheck().catch(console.error);
}

module.exports = { runHealthCheck, checkEndpoint, checkConnection };