#!/usr/bin/env node

/**
 * 🔍 TechBasket System Health Checker - גרסה משופרת
 * כלי מקצועי לבדיקת מערכת עגלת הקניות
 */

const http = require('http');
const { performance } = require('perf_hooks');

// הגדרות מערכת
const CONFIG = {
  server: { host: 'localhost', port: 3000, timeout: 3000 },
  client: { host: 'localhost', port: 5173, timeout: 2000 }
};

// צבעים לקונסול
const colors = {
  reset: '\x1b[0m', bold: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m'
};

class HealthChecker {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // בדיקת חיבור TCP מהירה
  checkConnection(host, port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 1500);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  // בקשת HTTP מסודרת
  makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: CONFIG.server.host,
        port: CONFIG.server.port,
        path,
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        timeout: CONFIG.server.timeout
      };

      const startTime = performance.now();
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const latency = Math.round(performance.now() - startTime);
          resolve({
            status: res.statusCode,
            data,
            latency,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(CONFIG.server.timeout, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // בדיקת endpoint עם תוצאה נקייה
  async testEndpoint(name, method, path, body = null, expectedStatus = null) {
    try {
      const result = await this.makeRequest(method, path, body);
      const success = expectedStatus ? result.status === expectedStatus : result.success;
      
      const icon = success ? '✅' : '❌';
      const color = success ? 'green' : 'red';
      const nameFormatted = name.padEnd(25);
      const latencyText = `${result.latency}ms`.padStart(6);
      
      this.log(`  ${icon} ${nameFormatted} ${result.status} ${latencyText}`, color);
      
      this.results.push({ name, success, status: result.status, latency: result.latency });
      return success;
    } catch (error) {
      this.log(`  ❌ ${name.padEnd(25)} ERROR ${error.message}`, 'red');
      this.results.push({ name, success: false, error: error.message });
      return false;
    }
  }

  async runHealthCheck() {
    this.log('\n🔍 TechBasket Health Check', 'cyan');
    this.log('═'.repeat(50), 'cyan');
    
    // 1. בדיקת חיבורים
    this.log('\n📡 בדיקת שרתים:', 'blue');
    const [serverUp, clientUp] = await Promise.all([
      this.checkConnection(CONFIG.server.host, CONFIG.server.port),
      this.checkConnection(CONFIG.client.host, CONFIG.client.port)
    ]);

    this.log(`  ${serverUp ? '✅' : '❌'} Server (${CONFIG.server.host}:${CONFIG.server.port})`, 
             serverUp ? 'green' : 'red');
    this.log(`  ${clientUp ? '✅' : '❌'} Client (${CONFIG.client.host}:${CONFIG.client.port})`, 
             clientUp ? 'green' : 'red');

    if (!serverUp) {
      this.log('\n❌ השרת לא זמין!', 'red');
      this.showQuickFixes();
      return;
    }

    // 2. בדיקת API endpoints
    this.log('\n🏥 בדיקות בריאות:', 'blue');
    await this.testEndpoint('Health Basic', 'GET', '/api/health');
    await this.testEndpoint('Health Detailed', 'GET', '/api/health/detailed');

    this.log('\n📦 בדיקות מוצרים:', 'blue');
    await this.testEndpoint('Products List', 'GET', '/api/products');
    await this.testEndpoint('Single Product', 'GET', '/api/products/1');
    await this.testEndpoint('Invalid Product', 'GET', '/api/products/999999', null, 404);

    this.log('\n🛒 בדיקות עגלה:', 'blue');
    const testSession = `health-${Date.now()}`;
    
    // קבלת עגלה
    await this.testEndpoint('Get Cart', 'GET', `/api/cart?sessionId=${testSession}`);
    
    // הוספה לעגלה
    await this.testEndpoint('Add to Cart', 'POST', '/api/cart/add', {
      sessionId: testSession,
      productId: '1',
      quantity: 2
    });

    // עדכון כמות
    await this.testEndpoint('Update Cart', 'PUT', '/api/cart/update', {
      sessionId: testSession,
      productId: '1', 
      quantity: 3
    });

    // הסרה מעגלה
    await this.testEndpoint('Remove Item', 'DELETE', '/api/cart/remove', {
      sessionId: testSession,
      productId: '1'
    });

    // ניקוי עגלה
    await this.testEndpoint('Clear Cart', 'DELETE', '/api/cart/clear', {
      sessionId: testSession
    });

    this.showSummary();
  }

  showQuickFixes() {
    this.log('\n💡 פתרונות מהירים:', 'yellow');
    this.log('   1. cd server && npm run dev', 'gray');
    this.log('   2. בדוק MongoDB: mongo', 'gray');
    this.log('   3. בדוק Redis: redis-cli ping', 'gray');
  }

  showSummary() {
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : 0;
    const avgLatency = this.results.filter(r => r.latency).reduce((sum, r) => sum + r.latency, 0) / this.results.length || 0;
    const duration = Math.round(performance.now() - this.startTime);

    this.log('\n📊 סיכום:', 'blue');
    this.log(`  ✅ הצליחו: ${successful}/${total} (${successRate}%)`, 'green');
    this.log(`  ❌ כשלו: ${total - successful}/${total}`, 'red');
    this.log(`  ⚡ זמן ממוצע: ${Math.round(avgLatency)}ms`, 'gray');
    this.log(`  ⏱️ זמן כולל: ${duration}ms`, 'gray');

    // הערכת מצב
    if (successRate == 100) {
      this.log('\n🎉 המערכת תקינה לחלוטין!', 'green');
    } else if (successRate >= 80) {
      this.log('\n⚠️ המערכת עובדת עם בעיות קלות', 'yellow');
    } else {
      this.log('\n🚨 יש בעיות משמעותיות במערכת', 'red');
    }

    this.log('\n🔗 קישורים מהירים:', 'blue');
    this.log(`   🌐 האתר: http://${CONFIG.client.host}:${CONFIG.client.port}`, 'gray');
    this.log(`   🔧 API: http://${CONFIG.server.host}:${CONFIG.server.port}/api/health`, 'gray');
    this.log('   📮 Postman: server/postman/collection.json', 'gray');
    this.log('');

    // Exit code based on results
    process.exit(successRate == 100 ? 0 : 1);
  }
}

// הפעלה
if (require.main === module) {
  new HealthChecker().runHealthCheck().catch(console.error);
}

module.exports = HealthChecker;