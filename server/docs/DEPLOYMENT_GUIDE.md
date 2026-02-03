# Deployment Guide

Complete guide for deploying Simple Shop backend to production environments.

## Table of Contents

1. Prerequisites & Planning
2. Database Setup
3. Environment Configuration
4. Docker Containerization
5. Deployment to Render.com
6. Deployment to AWS EC2
7. Production Checklist
8. Monitoring & Alerts
9. Scaling & Performance
10. Disaster Recovery

---

## 1. Prerequisites & Planning

### Infrastructure Requirements

| Component | Development | Staging | Production |
|-----------|-------------|---------|-----------|
| **API Servers** | 1 instance | 1-2 instances | 3+ instances (auto-scaling) |
| **MongoDB** | Single node | Replica set (3 nodes) | Replica set (3-5 nodes) + backups |
| **Redis** | Single instance | Replicated (2 nodes) | Cluster (6 nodes) or managed service |
| **Load Balancer** | None | Application LB | Network LB (AWS) / CDN |
| **SSL/TLS** | Self-signed | Let's Encrypt | ACM / Professional cert |
| **Monitoring** | Basic | CloudWatch / Datadog | Full observability stack |
| **Backups** | Daily | Daily | Hourly + automated recovery |

### Cost Estimation (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| **MongoDB Atlas** | M10 (2GB RAM) | $57 |
| **Redis** | AWS ElastiCache (cache.t3.micro) | $16 |
| **API Server** | Render.com (Starter $7) x3 | $21 |
| **CDN** | Cloudflare (free tier) | $0 |
| **Monitoring** | Datadog (free tier) | $0 |
| **Domain** | Namecheap / Route53 | $10-15/year |
| **Total (Monthly)** | | **~$94** |

### Choose Your Deployment Platform

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Render.com** | Easy, free tier, managed | Limited customization | Quick prototyping, MVPs |
| **AWS EC2** | Full control, mature | More setup, higher cost | Enterprise, complex needs |
| **DigitalOcean** | Simple, affordable | Limited managed services | Small teams, learning |
| **Heroku** | Easiest, no DevOps | Most expensive | Team preference over cost |

**Recommendation for Interview Project:** Start with Render.com (fast, free tier), upgrade to AWS if needed.

---

## 2. Database Setup

### MongoDB Atlas Setup (Recommended)

**Step 1: Create Cluster**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Create new project
4. Select "Build a Database"
5. Choose "M0 Shared" (free, 512MB storage)
6. Select region closest to your servers

**Step 2: Security Setup**
```
1. Network Access → Add IP Address
2. Add your current IP: Click "Allow From My IP"
3. For production: Add load balancer IPs, not 0.0.0.0/0
4. Create database user: "admin" with strong password
```

**Step 3: Connection String**
```
Server → Connect → MongoDB for Applications
Connection String: mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/simple-shop?retryWrites=true&w=majority
```

**Step 4: Enable Transactions (REQUIRED)**
```
Deployment → Replica Set (already enabled on free tier)
Verify: All 3 nodes show in Instances tab
```

### Local MongoDB Testing

**Start MongoDB locally:**
```bash
# macOS (brew)
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify
mongo --eval "db.adminCommand('ping')"
```

### Database Initialization

**Create indexes & seed data:**
```bash
npm run seed
```

**Verify indexes:**
```bash
# Connect to database
mongosh "mongodb+srv://admin:PASSWORD@cluster.xxxxx.mongodb.net/simple-shop"

# List indexes
db.products.getIndexes()
db.orders.getIndexes()
db.carts.getIndexes()
```

---

## 3. Environment Configuration

### Environment Variables

**Create `.env.production`:**
```env
# Application
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/simple-shop?retryWrites=true&w=majority
MONGODB_MAX_CONNECTIONS=20
MONGODB_TIMEOUT=30000

# Cache
REDIS_URL=redis://default:PASSWORD@redis-host.com:6379
REDIS_TTL=86400
REDIS_ENABLED=true

# Stripe
STRIPE_SECRET_KEY=sk_live_... # From Stripe dashboard (production key)
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe webhook settings

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_32_CHARS_MIN
REFRESH_SECRET=GENERATE_STRONG_SECRET_32_CHARS_MIN
JWT_EXPIRY=15m
REFRESH_EXPIRY=7d

# Server
CLIENT_URL=https://shop.example.com # Production frontend URL
API_URL=https://api.shop.example.com
HTTPS_ONLY=true

# Logging
LOG_FORMAT=json
LOG_LEVEL=info
SENTRY_DSN=https://key@sentry.io/project # Error tracking (optional)

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_ENABLED=true

# Email (if using transactional email)
SENDGRID_API_KEY=SG.xxxxx
MAIL_FROM=noreply@shop.example.com

# Admin
ADMIN_EMAIL=admin@example.com
```

### Generate Secure Secrets

```bash
# Generate 32-character random string
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Storage & Distribution

**Never commit secrets to git:**
```bash
# .gitignore
.env
.env.*.local
secrets/
```

**Use secret management:**
- **Render.com:** Environment variables in dashboard
- **AWS:** Secrets Manager or Parameter Store
- **Local:** `.env` file (gitignored)

---

## 4. Docker Containerization

### Dockerfile

**Create `Dockerfile`:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/server.js"]
```

### Docker Compose (for local testing)

**Create `docker-compose.yml`:**
```yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/simple-shop
      - REDIS_URL=redis://redis:6379
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - JWT_SECRET=dev-secret-change-in-production
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - shop

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - shop
    command: --replSet rs0
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=admin

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - shop

volumes:
  mongo_data:
  redis_data:

networks:
  shop:
    driver: bridge
```

**Build and run:**
```bash
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f api

# Stop
docker-compose down
```

---

## 5. Deployment to Render.com

### Quick Deploy (Recommended for MVP)

**Step 1: Push Code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/simple-shop-backend.git
git push -u origin main
```

**Step 2: Create Render Service**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select GitHub repository
5. Configure:
   - **Name:** simple-shop-api
   - **Region:** Select closest to users (us-east-1)
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter (free $7/month)

**Step 3: Environment Variables**
1. Go to Service Settings
2. Environment → Add From File
3. Paste `.env.production` contents
4. Save

**Step 4: Deploy**
1. Click "Deploy"
2. Watch logs in "Logs" tab
3. Once deployed, get URL: `https://your-service-name.onrender.com`

**Step 5: Test**
```bash
curl https://your-service-name.onrender.com/health
# Response: {"status":"ok",...}
```

### Advanced: Multiple Instances with Load Balancer

**For production (more than 100 concurrent users):**
1. Create 3 web services (same config, different names)
2. Add reverse proxy (Nginx) or use Render's load balancer
3. Configure sticky sessions for carts/auth

---

## 6. Deployment to AWS EC2

### Infrastructure Setup

**Step 1: Launch EC2 Instance**
```bash
# AWS Console → EC2 → Launch Instance
# Select: Ubuntu 22.04 LTS, t3.medium
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
# Create key pair: download .pem file
```

**Step 2: Connect via SSH**
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

**Step 3: Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm

# Verify
node --version
npm --version
```

**Step 4: Install PM2 (Process Manager)**
```bash
sudo npm install -g pm2

# Start on boot
pm2 startup
pm2 save
```

**Step 5: Deploy Application**
```bash
# Clone repository
git clone https://github.com/YOUR_USER/simple-shop-backend.git
cd simple-shop-backend/server

# Install dependencies
npm install

# Create .env
nano .env # Add environment variables

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name "shop-api"
pm2 save
```

**Step 6: Setup Nginx Reverse Proxy**
```bash
sudo apt-get install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/default
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.shop.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable HTTPS with Let's Encrypt:**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.shop.example.com
```

### Auto-Scaling with AWS

**For handling traffic spikes:**

1. Create AMI from EC2 instance
2. Create Launch Template using AMI
3. Create Auto Scaling Group with:
   - Min: 2 instances
   - Max: 10 instances
   - Target CPU utilization: 70%
4. Create Application Load Balancer in front
5. Add health check: `/health`

---

## 7. Production Checklist

### Pre-Deployment

- [ ] All tests passing: `npm run test`
- [ ] No TypeScript errors: `npm run build`
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Redis backups enabled
- [ ] SSL/TLS certificate installed
- [ ] CORS whitelist updated (production URLs)
- [ ] Stripe webhooks configured for production keys
- [ ] Email service configured (SendGrid, etc.)
- [ ] Error tracking configured (Sentry, Rollbar)
- [ ] Monitoring/alerting configured (Datadog, PagerDuty)

### Deployment

- [ ] Database migrated to production
- [ ] Indexes created
- [ ] Initial admin user created: `npm run make-admin admin@example.com`
- [ ] Seed data loaded (products, categories)
- [ ] Application deployed and health check passes
- [ ] API responds to requests
- [ ] Authentication works
- [ ] Payment flow tested with Stripe test keys
- [ ] Webhooks are being received

### Post-Deployment

- [ ] Monitor error logs for 30 minutes
- [ ] Test critical user flows:
  - Create account
  - Browse products
  - Add to cart
  - Checkout (test payment)
  - Verify order in DB
- [ ] Check metrics dashboard
- [ ] Verify backups are running
- [ ] Test failover (if applicable)
- [ ] Document deployment notes
- [ ] Notify team of launch

---

## 8. Monitoring & Alerts

### Application Monitoring

**Datadog Setup (free tier):**
```bash
# Install agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=YOUR_API_KEY DD_SITE=datadoghq.com bash -c "$(curl -L https://s3.amazonaws.com/datadog-agent/scripts/install_mac_agent.sh)"

# Add to application
npm install --save dd-trace

# In app.ts (before other imports)
const tracer = require('dd-trace').init()
```

**Key Metrics to Monitor:**
- HTTP request latency (P50, P95, P99)
- Error rate (4xx, 5xx)
- Database connection pool usage
- Redis hit rate
- Payment success rate
- Webhook processing time

### Alerts

**Configure alerts for:**
- Error rate > 1%
- Response time P95 > 500ms
- Database connection pool > 80%
- Redis memory > 80%
- Payment failures > 5%
- Webhook processing delay > 5 seconds

### Log Aggregation

**CloudWatch (AWS):**
```javascript
// Application logs automatically sent to CloudWatch
// View: CloudWatch → Log Groups → /aws/ec2/simple-shop
```

**ELK Stack (Self-hosted):**
```bash
docker-compose up -d elasticsearch logstash kibana

# Configure Logstash to parse Pino JSON logs
# Query: Find all failed payments in ELK
```

---

## 9. Scaling & Performance

### Horizontal Scaling (Add More Servers)

**At 100 users:**
- Single API server sufficient
- Single MongoDB sufficient

**At 1,000 users:**
- Add 2-3 API servers behind load balancer
- Add MongoDB read replicas
- Separate read/write databases (optional)

**At 10,000 users:**
- 10+ API servers with auto-scaling
- MongoDB sharded cluster
- Redis cluster (not single instance)
- CDN for static assets
- Consider microservices (separate order service, payment service)

### Database Optimization

**MongoDB:**
```javascript
// 1. Add indexes (already created)
// 2. Connection pooling (configured)
// 3. Read preference: secondary for product searches
db.products.find({}).readPref("secondary")

// 4. Sharding (if > 100GB data)
sh.shardCollection("simple-shop.products", { _id: 1 })
```

**Redis:**
```bash
# Enable persistence
save 60 10000 # Save if 10,000 keys changed in 60 seconds

# Memory eviction policy
maxmemory-policy allkeys-lru # Remove least recently used

# Cluster (for high availability)
cluster-enabled yes
cluster-node-timeout 5000
```

### Query Optimization

**Slow Query Log (MongoDB):**
```javascript
// In production, log queries > 100ms
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).pretty()
```

---

## 10. Disaster Recovery

### Backup Strategy

**Daily backups:**
```bash
# MongoDB Atlas: Automated daily backups (free tier)
# Settings → Backup & Restore → Automatic Backup
# Keep 7 days of backups

# Manual backup
mongodump --uri="mongodb+srv://..." --out=./backups/$(date +%Y-%m-%d)

# Restore from backup
mongorestore --uri="mongodb+srv://..." ./backups/2024-01-28/
```

**Redis persistence:**
```bash
# RDB (point-in-time snapshot)
BGSAVE # Async save to disk

# AOF (append-only file - all operations logged)
appendonly yes
appendfsync everysec
```

### Failover Plan

**Database failover:**
```
1. MongoDB replica set automatic failover (< 10 seconds)
2. Application automatically reconnects
3. No manual intervention needed
```

**Application server failover:**
```
1. Load balancer health check fails (5 seconds)
2. Traffic redirected to healthy servers
3. Failed server can be replaced
```

**Redis failover:**
```
1. Set up Redis Sentinel (high availability)
2. Automatic master → slave promotion on failure
3. Application reconnects automatically
```

### Recovery Procedures

**Complete data loss scenario:**
```
1. Stop all API servers
2. Drop production database
3. Restore from latest backup
4. Verify data integrity
5. Start API servers
6. Monitor for errors
```

**API server crash:**
```
1. Health check detects failure (30 seconds)
2. Load balancer removes from rotation
3. Auto-scaling launches replacement
4. Developer notified via PagerDuty
```

---

## Deployment Scripts

### Automated Deployment Script

**Create `deploy.sh`:**
```bash
#!/bin/bash
set -e # Exit on error

echo "🚀 Deploying Simple Shop Backend..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Build
echo "🔨 Building..."
npm run build

# 4. Run tests
echo "🧪 Running tests..."
npm run test

# 5. Build Docker image
echo "🐳 Building Docker image..."
docker build -t shop-api:$(git rev-parse --short HEAD) .

# 6. Push to registry (if using)
echo "📤 Pushing to registry..."
docker push YOUR_REGISTRY/shop-api:$(git rev-parse --short HEAD)

# 7. Update deployment
echo "✅ Deployment complete!"
echo "URL: https://api.shop.example.com"
```

**Run deployment:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Support

### Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Health check fails** | App not starting | Check logs: `docker logs API_CONTAINER` |
| **Database connection error** | Wrong connection string | Verify `MONGODB_URI` in environment |
| **Webhook not received** | Wrong endpoint | Check Stripe dashboard webhook URL |
| **Out of memory** | App leak or too many requests | Increase instance size, add monitoring |
| **High latency** | Database too slow | Add indexes, scale database |

### Getting Help

1. Check application logs
2. Verify environment variables
3. Test with simple health endpoint
4. Check external service status (Stripe, MongoDB)
5. Review deployment documentation

---

**Next Steps:**
- [Back to README.md](../README.md)
- [Architecture Documentation](./ARCHITECTURE_NARRATIVE.md)
- [Security Documentation](./SECURITY_DESIGN_DECISIONS.md)
