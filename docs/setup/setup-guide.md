# 🚀 הוראות הקמה - מערכת עגלת קניות מלאה
*כל מה שצריך כדי להריץ את המערכת*

---

## 🏗️ **הקמת הסביבה**

### **1. Prerequisites - דברים שצריכים להיות מותקנים**

```bash
# Node.js (גרסה 18 ומעלה)
node --version  # v18.0.0+

# MongoDB (מקומי או Atlas)
mongod --version

# Redis (מקומי או cloud)
redis-server --version

# Git
git --version
```

---

### **2. התקנת התלויות**

#### **Server (Backend):**
```bash
cd server/
npm install

# תלויות נדרשות:
npm install express mongoose redis cors helmet
npm install -D @types/node @types/express @types/cors typescript ts-node nodemon
```

#### **Client (Frontend):**
```bash
cd client/
npm install

# תלויות נדרשות:
npm install react react-dom @reduxjs/toolkit react-redux react-router-dom
npm install -D @types/react @types/react-dom typescript vite tailwindcss
```

---

### **3. קבצי Environment**

#### **Server Environment (.env):**
```env
# server/.env
NODE_ENV=development
PORT=4001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/simple-shop
# או עבור MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/simple-shop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# או עבור Redis Cloud:
# REDIS_URL=redis://username:password@host:port

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Security
BCRYPT_ROUNDS=12

# CORS
CLIENT_URL=http://localhost:3000
```

#### **Client Environment (.env):**
```env
# client/.env
VITE_API_URL=http://localhost:4001/api
VITE_APP_NAME=TechBasket
```

---

## 🔧 **הגדרת מסדי הנתונים**

### **MongoDB Setup:**

#### **אפשרות 1: MongoDB מקומי**
```bash
# התקנה ב-Windows (עם Chocolatey)
choco install mongodb

# התקנה ב-macOS (עם Homebrew)  
brew install mongodb/brew/mongodb-community

# התקנה ב-Linux (Ubuntu)
sudo apt-get install mongodb

# הפעלה
mongod --dbpath /path/to/your/db
```

#### **אפשרות 2: MongoDB Atlas (Cloud)**
1. הרשמה ב-[MongoDB Atlas](https://cloud.mongodb.com)
2. יצירת Cluster חדש (בחר Free Tier)
3. הגדרת Database User
4. הגדרת IP Whitelist (0.0.0.0/0 לפיתוח)
5. העתקת Connection String ל-`.env`

### **Redis Setup:**

#### **אפשרות 1: Redis מקומי**
```bash
# התקנה ב-Windows (עם Chocolatey)
choco install redis-64

# התקנה ב-macOS (עם Homebrew)
brew install redis

# התקנה ב-Linux (Ubuntu)
sudo apt-get install redis-server

# הפעלה
redis-server
```

#### **אפשרות 2: Redis Cloud**
1. הרשמה ב-[Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. יצירת Database חדש (30MB Free)
3. העתקת Connection Details ל-`.env`

---

## 🏃‍♂️ **הרצת המערכת**

### **1. הפעלת MongoDB ו-Redis**
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Redis  
redis-server

# או אם השתמשת ב-Cloud - אין צורך להפעיל דבר
```

### **2. הפעלת Backend**
```bash
cd server/

# פעם ראשונה - seed המוצרים
npm run seed

# הפעלת השרת
npm run dev

# צריך לראות:
# 🚀 Server running on port 4001
# 📊 MongoDB connected successfully
# ⚡ Redis connected successfully
```

### **3. הפעלת Frontend**
```bash
cd client/

# הפעלת הפיתוח
npm run dev

# צריך לראות:
# ➜  Local:   http://localhost:3000/
# ➜  Network: use --host to expose
```

### **4. בדיקה שהכל עובד**
```bash
# בדיקת API
curl http://localhost:4001/api/health

# בדיקת מוצרים
curl http://localhost:4001/api/products

# פתיחת הדפדפן
open http://localhost:3000
```

---

## 🎯 **מבנה קבצי הפרויקט**

```
project/
├── server/                     # Backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── cart.model.ts
│   │   │   └── product.model.ts
│   │   ├── services/
│   │   │   ├── cart.service.ts
│   │   │   └── product.service.ts
│   │   ├── controllers/
│   │   │   ├── cart.controller.ts
│   │   │   └── product.controller.ts
│   │   ├── routes/
│   │   │   ├── cart.routes.ts
│   │   │   └── product.routes.ts
│   │   ├── config/
│   │   │   ├── db.ts
│   │   │   └── redisClient.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── .env
│
├── client/                     # Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.ts
│   │   │   ├── api.ts
│   │   │   └── cartSlice.ts
│   │   ├── components/
│   │   │   ├── ProductList.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── ProductCard.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env
│
├── CART-FLOW-COMPLETE.md       # תיעוד זרימות
├── CART-CODE-EXAMPLES.md       # דוגמאות קוד
└── ARCHITECTURE.md             # ארכיטקטורה
```

---

## 🔍 **בדיקות ותחזוקה**

### **Scripts נפוצים:**

#### **Server:**
```bash
# הפעלת שרת פיתוח
npm run dev

# בנייה לפרודקציה
npm run build

# הרצת טסטים
npm test

# הפעלת seed למוצרים
npm run seed

# בדיקת ESLint
npm run lint
```

#### **Client:**
```bash
# הפעלת שרת פיתוח
npm run dev

# בנייה לפרודקציה
npm run build

# preview של בנייה
npm run preview

# בדיקת טיפוסים
npx tsc --noEmit
```

### **בדיקות API עם curl:**
```bash
# בדיקת בריאות השרת
curl http://localhost:4001/api/health

# קבלת כל המוצרים
curl http://localhost:4001/api/products

# יצירת עגלה חדשה
curl -X POST http://localhost:4001/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","productId":"PRODUCT_ID","quantity":1}'

# קבלת עגלה
curl "http://localhost:4001/api/cart?sessionId=test-123"
```

---

## 🐛 **פתרון בעיות נפוצות**

### **שגיאות MongoDB:**
```bash
# שגיאה: connection refused
# פתרון: וודא ש-MongoDB רץ
mongod --dbpath /path/to/db

# שגיאה: authentication failed
# פתרון: בדוק username/password ב-.env
```

### **שגיאות Redis:**
```bash
# שגיאה: Redis connection failed
# פתרון: וודא ש-Redis רץ
redis-server

# שגיאה: timeout connecting
# פתרון: בדוק REDIS_HOST ו-REDIS_PORT ב-.env
```

### **שגיאות Frontend:**
```bash
# שגיאה: Cannot connect to API
# פתרון: בדוק VITE_API_URL ב-.env

# שגיאה: Module not found
# פתרון: נקה cache ותתקן מחדש
rm -rf node_modules package-lock.json
npm install
```

### **שגיאות CORS:**
```bash
# הוסף ל-server/src/app.ts:
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
```

---

## 🚀 **Deploy לפרודקציה**

### **Backend (Node.js + MongoDB + Redis):**

#### **Heroku:**
```bash
# התקנת Heroku CLI
npm install -g heroku

# התחברות
heroku login

# יצירת אפליקציה
heroku create your-app-backend

# הוספת addons
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev

# העלאה
git push heroku main
```

#### **Railway/Render:**
1. חבר את GitHub Repository
2. הוסף Environment Variables
3. Deploy אוטומטי

### **Frontend (React):**

#### **Vercel:**
```bash
# התקנת Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### **Netlify:**
```bash
# בנייה מקומית
npm run build

# העלאה ידנית או חיבור Git
```

---

## 📊 **Monitoring וAnalytics**

### **הוספת Logging:**
```typescript
// server/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});
```

### **מטריקות עגלת קניות:**
```typescript
// הוסף ל-CartService
static async getCartAnalytics() {
  return {
    totalCarts: await CartModel.countDocuments(),
    activeCarts: await CartModel.countDocuments({ 
      updatedAt: { $gte: new Date(Date.now() - 24*60*60*1000) } 
    }),
    averageValue: await CartModel.aggregate([
      { $group: { _id: null, avg: { $avg: "$total" } } }
    ]),
    // עוד מטריקות...
  };
}
```

---

## ✅ **Checklist להפעלה**

- [ ] Node.js מותקן (v18+)
- [ ] MongoDB רץ ומחובר
- [ ] Redis רץ ומחובר  
- [ ] משתני Environment מוגדרים
- [ ] תלויות מותקנות (npm install)
- [ ] Seed רץ בהצלחה
- [ ] שרת Backend עולה על port 4001
- [ ] שרת Frontend עולה על port 3000
- [ ] API calls עובדים
- [ ] Redux DevTools מותקן
- [ ] עגלה עובדת (הוסף/עדכן/מחק)

**כשהכל עובד - אתה מוכן להתחיל לפתח! 🎉**

---

## 🆘 **קבלת עזרה**

אם יש בעיות:
1. בדוק את ה-console logs
2. בדוק את Network tab ב-DevTools
3. בדוק את שגיאות ב-terminal
4. עבור על ה-Troubleshooting guide
5. שאל בקמיוניטי או פתח Issue ב-GitHub

**מוכן להתחיל לבנות משהו מדהים! 🚀**