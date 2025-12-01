# 🧪 רשימת בדיקות מלאה - Simple Shop

## 📋 סדר הבדיקות

עקוב אחרי הסדר הזה כדי לוודא שהכל עובד נכון.

---

## 🚀 שלב 1: הרצת הסביבה

### 1.1 MongoDB
```bash
# בדוק ש-MongoDB רץ
mongosh
# אמור להתחבר בהצלחה

# או בדוק את הסטטוס:
# Windows: תבדוק ב-Services שהשירות MongoDB רץ
# Mac/Linux: sudo systemctl status mongod
```

**✅ מה לבדוק:**
- [ ] MongoDB מתחבר בהצלחה
- [ ] אין הודעות שגיאה

---

### 1.2 Redis
```bash
# בדוק ש-Redis רץ
redis-cli ping
# אמור להחזיר: PONG
```

**✅ מה לבדוק:**
- [ ] Redis עונה PONG
- [ ] אין הודעות שגיאה

---

### 1.3 הרצת השרת (Backend)
```bash
cd server
npm run dev
```

**✅ מה לבדוק:**
- [ ] השרת עולה על פורט 4001
- [ ] הודעה: "🚀 Server running on http://localhost:4001"
- [ ] הודעה: "✅ MongoDB Connected"
- [ ] הודעה: "✅ Redis Connected"
- [ ] אין שגיאות באדום

**❌ אם יש בעיה:**
- בדוק `.env` קיים עם המשתנים הנכונים
- בדוק שהפורט 4001 לא תפוס
- בדוק ש-MongoDB ו-Redis רצים

---

### 1.4 הרצת הקליינט (Frontend)
```bash
cd client
npm run dev
```

**✅ מה לבדוק:**
- [ ] הקליינט עולה על פורט 5173 (או 3000)
- [ ] דפדפן נפתח אוטומטית
- [ ] אין שגיאות באדום

---

## 🧪 שלב 2: בדיקות Backend API

### 2.1 Health Check
```bash
# בדפדפן או Postman:
GET http://localhost:4001/api/health
```

**✅ תוצאה צפויה:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T...",
  "uptime": 123.45,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**מה לבדוק:**
- [ ] סטטוס 200
- [ ] database: "connected"
- [ ] redis: "connected"

---

### 2.2 קבלת מוצרים
```bash
GET http://localhost:4001/api/products
```

**✅ תוצאה צפויה:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "iPhone 14 Pro",
      "price": 3500,
      "stock": 50,
      "image": "...",
      ...
    }
  ]
}
```

**מה לבדוק:**
- [ ] סטטוס 200
- [ ] יש מערך של מוצרים
- [ ] כל מוצר יש לו: _id, name, price, stock, image

**❌ אם מערך ריק:**
```bash
# הרץ seed:
cd server
npm run seed
```

---

### 2.3 יצירת עגלה + הוספת מוצר
```bash
POST http://localhost:4001/api/cart/add
Content-Type: application/json

{
  "sessionId": "test-session-123",
  "productId": "PUT_REAL_PRODUCT_ID_HERE",
  "quantity": 1
}
```

**✅ תוצאה צפויה:**
```json
{
  "success": true,
  "data": {
    "sessionId": "test-session-123",
    "items": [
      {
        "product": { ... },
        "quantity": 1,
        "price": 3500
      }
    ],
    "total": 3500
  },
  "message": "Item added to cart"
}
```

**מה לבדוק:**
- [ ] סטטוס 200
- [ ] יש items עם המוצר
- [ ] total מחושב נכון
- [ ] בטרמינל של השרת: לוגים של Redis ו-MongoDB

---

### 2.4 קבלת עגלה
```bash
GET http://localhost:4001/api/cart?sessionId=test-session-123
```

**✅ תוצאה צפויה:**
- [ ] מחזיר את העגלה עם המוצר שהוספת
- [ ] total נכון

---

### 2.5 עדכון כמות
```bash
PUT http://localhost:4001/api/cart/update
Content-Type: application/json

{
  "sessionId": "test-session-123",
  "productId": "PUT_REAL_PRODUCT_ID_HERE",
  "quantity": 3
}
```

**מה לבדוק:**
- [ ] הכמות השתנתה ל-3
- [ ] total עודכן בהתאם

---

### 2.6 הסרת מוצר
```bash
DELETE http://localhost:4001/api/cart/remove
Content-Type: application/json

{
  "sessionId": "test-session-123",
  "productId": "PUT_REAL_PRODUCT_ID_HERE"
}
```

**מה לבדוק:**
- [ ] המוצר הוסר מהעגלה
- [ ] total עודכן

---

### 2.7 יצירת הזמנה
```bash
POST http://localhost:4001/api/orders/create
Content-Type: application/json

{
  "sessionId": "test-session-123"
}
```

**✅ תוצאה צפויה:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-1234567890",
    "items": [...],
    "totalAmount": 3500,
    "status": "pending"
  }
}
```

**מה לבדוק:**
- [ ] נוצר orderNumber
- [ ] יש items
- [ ] status: "pending"
- [ ] העגלה התרוקנה

---

## 🎨 שלב 3: בדיקות Frontend (UI)

### 3.1 דף ראשי - רשימת מוצרים

**בדפדפן: http://localhost:5173**

**מה לבדוק:**
- [ ] המוצרים מוצגים בכרטיסיות
- [ ] כל מוצר יש לו: תמונה, שם, מחיר, כפתור
- [ ] דירוג כוכבים מוצג
- [ ] מלאי מוצג ("In Stock (50)")
- [ ] אין הודעות שגיאה
- [ ] אין שגיאות בקונסול (F12)

---

### 3.2 הוספה לעגלה - Optimistic Update

**צעדים:**
1. לחץ על "Add to Cart" על מוצר כלשהו
2. **שים לב למהירות!**

**מה לבדוק:**
- [ ] הכפתור משתנה **מיד** ל-"In Cart (1)"
- [ ] הצבע משתנה לירוק
- [ ] אין עיכוב או המתנה
- [ ] בקונסול (F12): "📤 Sending to server"
- [ ] אחר כך: "📥 Server response"
- [ ] אחר כך: "✅ Added [שם מוצר] to cart"

---

### 3.3 הוספה מספר פעמים

**צעדים:**
1. לחץ 5 פעמים על אותו כפתור

**מה לבדוק:**
- [ ] הכפתור מראה "In Cart (5)"
- [ ] בכל לחיצה יש עדכון מיידי
- [ ] בטרמינל השרת: רק שמירה אחת ב-MongoDB (debouncing!)
- [ ] אבל מספר עדכוני Redis

---

### 3.4 דף עגלה

**צעדים:**
1. לחץ על "Cart" בניווט (או לך ל-/cart)

**מה לבדוק:**
- [ ] המוצרים מוצגים
- [ ] יש תמונה, שם, מחיר
- [ ] יש כפתורי + ו-minus לעדכון כמות
- [ ] יש כפתור Remove
- [ ] הסכום הכולל נכון
- [ ] יש כפתור "בצע הזמנה"

---

### 3.5 עדכון כמות בעגלה

**צעדים:**
1. לחץ על + כמה פעמים
2. לחץ על -

**מה לבדוק:**
- [ ] הכמות משתנה מיד (Optimistic)
- [ ] הסכום הכולל מתעדכן
- [ ] אין שגיאות
- [ ] בקונסול: בקשות API

---

### 3.6 הסרת מוצר

**צעדים:**
1. לחץ על Remove

**מה לבדוק:**
- [ ] המוצר נעלם מיד
- [ ] הסכום מתעדכן
- [ ] אם זה היה המוצר האחרון: "Your cart is empty"

---

### 3.7 ניקוי עגלה

**צעדים:**
1. הוסף כמה מוצרים
2. לחץ "Clear All"

**מה לבדוק:**
- [ ] כל המוצרים נעלמים
- [ ] הודעה: "Your cart is empty"

---

### 3.8 יצירת הזמנה

**צעדים:**
1. הוסף מוצרים לעגלה
2. לחץ "בצע הזמנה"

**מה לבדוק:**
- [ ] הופיע alert עם מספר הזמנה
- [ ] העגלה התרוקנה
- [ ] מועבר לדף Orders
- [ ] ההזמנה מוצגת שם

---

### 3.9 דף הזמנות

**נווט ל: /orders**

**מה לבדוק:**
- [ ] ההזמנות מוצגות
- [ ] יש מספר הזמנה
- [ ] יש תאריך
- [ ] יש סכום
- [ ] יש סטטוס (pending/completed/cancelled)
- [ ] יש כפתור "Cancel Order"

---

### 3.10 ביטול הזמנה

**צעדים:**
1. לחץ "Cancel Order" על הזמנה pending

**מה לבדוק:**
- [ ] הסטטוס משתנה ל-"cancelled"
- [ ] הכפתור נעלם

---

## 🔥 שלב 4: בדיקות שגיאות (Error Handling)

### 4.1 שרת מנותק

**צעדים:**
1. **עצור את השרת** (Ctrl+C בטרמינל)
2. נסה להוסיף מוצר לעגלה

**מה לבדוק:**
- [ ] הכפתור משתנה ל-"In Cart (1)" (Optimistic)
- [ ] אחרי כך חוזר ל-"Add to Cart" (Revert!)
- [ ] הודעת שגיאה: "Failed to add item to cart"
- [ ] אין crash של האפליקציה

**הפעל שוב את השרת ובדוק שהכל חוזר לעבוד**

---

### 4.2 מוצר לא קיים

**צעדים:**
1. שנה ידנית productId בקוד ל-ID שלא קיים
2. נסה להוסיף לעגלה

**מה לבדוק:**
- [ ] Optimistic Update קורה
- [ ] Revert קורה
- [ ] הודעת שגיאה
- [ ] בטרמינל השרת: "Product not found"

---

### 4.3 Redis מנותק

**צעדים:**
1. עצור את Redis
2. נסה להוסיף מוצר

**מה לבדוק:**
- [ ] המערכת עדיין עובדת (fallback ל-MongoDB)
- [ ] בטרמינל: "🚨 Redis failed, served from MongoDB only"
- [ ] הפעולה מצליחה אבל יותר איטית

---

### 4.4 מלאי לא מספיק

**צעדים:**
1. במסד נתונים, שנה stock ל-2
2. נסה להוסיף 5 יחידות

**מה לבדוק:**
- [ ] השרת מחזיר שגיאה: "Insufficient stock"
- [ ] Revert קורה
- [ ] הודעת שגיאה למשתמש

---

## 🔄 שלב 5: בדיקות Cache ו-Performance

### 5.1 בדיקת Redis Cache

**צעדים:**
1. הוסף מוצר לעגלה
2. בטרמינל:
```bash
redis-cli
> KEYS cart:*
> GET cart:guest:YOUR_SESSION_ID
```

**מה לבדוק:**
- [ ] יש key של העגלה
- [ ] הנתונים נכונים (JSON של העגלה)

---

### 5.2 בדיקת MongoDB Debouncing

**צעדים:**
1. לחץ מהר 10 פעמים על "Add to Cart"
2. צפה בטרמינל השרת

**מה לבדוק:**
- [ ] הרבה לוגים של Redis (מיידי)
- [ ] **רק שמירה אחת** ב-MongoDB (אחרי 5 שניות)
- [ ] לוג: "⏰ MongoDB save scheduled"
- [ ] לוג: "✅ MongoDB save completed"

---

### 5.3 בדיקת מהירות

**בכרום: F12 → Network**

**צעדים:**
1. רענן את הדף
2. לחץ "Add to Cart"
3. בדוק Network tab

**מה לבדוק:**
- [ ] הבקשה ל-/api/cart/add לוקחת < 100ms
- [ ] הUI מתעדכן מיד (לא תלוי בזמן התשובה)

---

## 🔐 שלב 6: בדיקות Session Management

### 6.1 Session ID נשמר

**צעדים:**
1. הוסף מוצר לעגלה
2. רענן את הדף (F5)

**מה לבדוק:**
- [ ] המוצרים עדיין בעגלה
- [ ] בקונסול (F12 → Application → LocalStorage):
  - יש `cart-session-id`
  - יש `cart`

---

### 6.2 מספר טאבים

**צעדים:**
1. פתח 2 טאבים של האתר
2. הוסף מוצר בטאב 1
3. עבור לטאב 2 ורענן

**מה לבדוק:**
- [ ] המוצר מופיע גם בטאב 2
- [ ] אותו sessionId

---

## 📊 שלב 7: בדיקות נוספות

### 7.1 Responsive Design

**צעדים:**
1. פתח DevTools (F12)
2. לחץ על Toggle Device Toolbar (Ctrl+Shift+M)
3. נסה גדלי מסך שונים

**מה לבדוק:**
- [ ] במובייל: 1-2 מוצרים בשורה
- [ ] בטאבלט: 2-3 מוצרים
- [ ] בדסקטופ: 4 מוצרים
- [ ] הכל נראה טוב בכל הגדלים

---

### 7.2 בדיקת קונסול

**F12 → Console**

**מה לבדוק:**
- [ ] אין שגיאות באדום
- [ ] יש לוגים מועילים:
  - "📤 Sending to server"
  - "📥 Server response"
  - "✅ Added..."

---

### 7.3 בדיקת Network

**F12 → Network**

**מה לבדוק:**
- [ ] כל הבקשות חוזרות 200 (ירוק)
- [ ] אין 404, 500 (אדום)
- [ ] בקשות ל-/api/products, /api/cart עובדות

---

## ✅ סיכום - Checklist מהיר

### Backend ✅
- [ ] MongoDB רץ
- [ ] Redis רץ
- [ ] Server רץ על 4001
- [ ] Health endpoint עובד
- [ ] Products endpoint עובד
- [ ] Cart endpoints עובדים
- [ ] Orders endpoints עובדים

### Frontend ✅
- [ ] קליינט רץ
- [ ] מוצרים מוצגים
- [ ] הוספה לעגלה עובדת (Optimistic)
- [ ] עגלה עובדת
- [ ] עדכון כמות עובד
- [ ] הסרת מוצרים עובדת
- [ ] יצירת הזמנה עובדת
- [ ] דף הזמנות עובד

### Performance ✅
- [ ] Optimistic Updates מהיר
- [ ] Redis Cache עובד
- [ ] MongoDB Debouncing עובד
- [ ] אין עיכובים

### Error Handling ✅
- [ ] Revert עובד כששרת נופל
- [ ] הודעות שגיאה מוצגות
- [ ] אין crashes
- [ ] Fallback ל-MongoDB עובד

---

## 🐛 בעיות נפוצות ופתרונות

### "Cannot connect to MongoDB"
```bash
# Windows:
# Services → MongoDB → Start

# Mac/Linux:
sudo systemctl start mongod
```

### "Redis connection failed"
```bash
# Windows: 
redis-server

# Mac:
brew services start redis

# Linux:
sudo systemctl start redis
```

### "Port 4001 already in use"
```bash
# מצא מה תופס את הפורט
# Windows:
netstat -ano | findstr :4001

# הרוג את התהליך:
taskkill /PID [PID_NUMBER] /F
```

### "npm run dev doesn't work"
```bash
# נקה והתקן מחדש:
rm -rf node_modules
npm install
npm run dev
```

---

## 📝 הערות חשובות

1. **תמיד בדוק את הקונסול!** F12 הוא החבר הכי טוב שלך
2. **צפה בטרמינל של השרת** - הרבה מידע מועיל שם
3. **השתמש ב-Postman** לבדיקות API ישירות
4. **Redis-cli** מועיל לראות מה בcache
5. **MongoDB Compass** כלי חזותי לבדיקת DB

---

## 🎯 סדר עדיפויות

אם הזמן מוגבל, בדוק בסדר הזה:

1. ✅ **קריטי** - שלב 1-3 (הרצה + API + UI בסיסי)
2. ⚠️ **חשוב** - שלב 4 (Error Handling)
3. 📊 **Nice to have** - שלב 5-7 (Performance + נוספות)

---

**בהצלחה! 🚀**

אם משהו לא עובד, חזור למדריך הזה ובדוק שוב צעד אחר צעד.
