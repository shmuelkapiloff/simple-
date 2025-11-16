# 🛠️ ארגז כלים - פקודות שימושיות למסד הנתונים
*כל הפקודות שאתה צריך לניהול ובדיקת המערכת*

---

## 📚 **תוכן עניינים**
- [MongoDB - פקודות בסיסיות](#mongodb---פקודות-בסיסיות)
- [מוצרים (Products)](#מוצרים-products)
- [עגלות (Carts)](#עגלות-carts)
- [חיפושים מתקדמים](#חיפושים-מתקדמים)
- [פעולות ניקוי ועריכה](#פעולות-ניקוי-ועריכה)
- [סטטיסטיקות ודוחות](#סטטיסטיקות-ודוחות)
- [פקודות מהירות לטרמינל](#פקודות-מהירות-לטרמינל)
- [Redis Commands](#redis-commands)
- [API Testing עם curl](#api-testing-עם-curl)
- [פקודות דיבוג מערכת](#פקודות-דיבוג-מערכת)

---

## 📊 **MongoDB - פקודות בסיסיות**

### התחברות ובדיקות ראשוניות
```bash
# התחברות למסד
mongosh simple_shop

# בתוך mongosh:
show dbs                          # כל מסדי הנתונים
show collections                  # כל הקולקשנים במסד הנוכחי
db.getName()                      # שם המסד הנוכחי
use simple_shop                   # החלפת מסד נתונים
exit                              # יציאה מmongosh
```

### מידע כללי על המסד
```javascript
db.stats()                        # סטטיסטיקות המסד
db.serverStatus()                 # סטטוס השרת
db.version()                      # גירסת MongoDB
db.runCommand({buildInfo: 1})     # מידע על הבנייה
```

---

## 📦 **מוצרים (Products)**

### בדיקות בסיסיות
```javascript
// ספירה
db.products.countDocuments()

// כל המוצרים
db.products.find().pretty()

// רק שדות ספציפיים
db.products.find({}, {name: 1, price: 1, sku: 1, _id: 0})

// מוצר ראשון
db.products.findOne()

// מוצר ספציפי
db.products.findOne({sku: "LEG-1"})
db.products.findOne({_id: ObjectId("YOUR_PRODUCT_ID")})
```

### חיפושים לפי קטגורייה ומחיר
```javascript
// לפי קטגוריה
db.products.find({category: "smartphones"})
db.products.find({category: "laptops"})
db.products.find({category: "audio"})

// לפי מחיר
db.products.find({price: {$gt: 500}})              # מעל $500
db.products.find({price: {$lt: 1000}})             # מתחת ל-$1000
db.products.find({price: {$gte: 500, $lte: 1500}}) # בין $500-$1500
db.products.find({price: {$in: [999, 1199, 1599]}}) # מחירים ספציפיים

// מוצרים זולים/יקרים
db.products.find().sort({price: 1}).limit(3)      # 3 הזולים ביותר
db.products.find().sort({price: -1}).limit(3)     # 3 היקרים ביותר
```

### חיפוש טקסט ומאפיינים
```javascript
// חיפוש בשם (case insensitive)
db.products.find({name: /iPhone/i})
db.products.find({name: /MacBook/i})
db.products.find({name: /Pro/i})

// מוצרים במלאי
db.products.find({stock: {$gt: 0}})
db.products.find({stock: {$gte: 10}})              # מלאי של 10+

// מוצרים מומלצים
db.products.find({featured: true})

// מוצרים פעילים
db.products.find({isActive: true})

// לפי דירוג
db.products.find({rating: {$gte: 4.5}})
```

### רשימות מסודרות
```javascript
// לפי שם (א-ב)
db.products.find().sort({name: 1})

// לפי מחיר (יקר לזול)
db.products.find().sort({price: -1})

// לפי קטגוריה ואז מחיר
db.products.find().sort({category: 1, price: 1})

// עם הגבלת תוצאות
db.products.find().sort({price: -1}).limit(5)
```

---

## 🛒 **עגלות (Carts)**

### בדיקות בסיסיות
```javascript
// ספירה
db.carts.countDocuments()

// כל העגלות
db.carts.find().pretty()

// רק מידע כללי
db.carts.find({}, {sessionId: 1, total: 1, itemCount: {$size: "$items"}, updatedAt: 1})

// העגלה שלך (החלף session ID)
db.carts.findOne({sessionId: "guest-1762688526749-lc9dle37n"})
```

### חיפושים לפי סטטוס עגלה
```javascript
// עגלות ריקות
db.carts.find({$or: [
  {"items": {$size: 0}},
  {"items": {$exists: false}}
]})

// עגלות עם פריטים
db.carts.find({"items.0": {$exists: true}})

// עגלות לפי מספר פריטים
db.carts.find({"items": {$size: 1}})               # עגלה עם פריט אחד
db.carts.find({"items.5": {$exists: true}})        # עגלות עם 6+ פריטים
```

### חיפושים לפי סכום ותאריך
```javascript
// לפי סכום
db.carts.find({total: {$gt: 1000}})                # מעל $1000
db.carts.find({total: {$gte: 500, $lte: 2000}})    # בין $500-$2000

// עגלות מהיום האחרון
db.carts.find({updatedAt: {$gte: new Date(Date.now() - 24*60*60*1000)}})

// עגלות מהשבוע האחרון
db.carts.find({updatedAt: {$gte: new Date(Date.now() - 7*24*60*60*1000)}})

// עגלות נטושות (מעל שעה ללא עדכון)
db.carts.find({updatedAt: {$lt: new Date(Date.now() - 60*60*1000)}})

// עגלות חדשות (מהיום)
db.carts.find({createdAt: {$gte: new Date(new Date().setHours(0,0,0,0))}})
```

### מידע על פריטים בעגלות
```javascript
// עגלות עם מוצר ספציפי
db.carts.find({"items.product": ObjectId("690ba54df1849f6b3392ec82")})

// עגלות עם כמות גדולה של מוצר
db.carts.find({"items": {$elemMatch: {quantity: {$gte: 5}}}})

// עגלות עם מחיר פריט גבוה
db.carts.find({"items": {$elemMatch: {price: {$gte: 1000}}}})
```

// עגלה לפי session ID מדויק
db.carts.findOne({sessionId: "guest-1762688526749-lc9dle37n"})

// כל העגלות עם session ID דומה
db.carts.find({sessionId: /guest-1762688526749/})
---

## 🔍 **חיפושים מתקדמים**

### אנליטיקה של מוצרים
```javascript
// כמה פעמים כל מוצר הוזמן
db.carts.aggregate([
  {$unwind: "$items"},
  {$group: {
    _id: "$items.product",
    productName: {$first: "$items.name"},
    totalOrdered: {$sum: "$items.quantity"},
    totalRevenue: {$sum: {$multiply: ["$items.quantity", "$items.price"]}},
    avgQuantity: {$avg: "$items.quantity"}
  }},
  {$sort: {totalOrdered: -1}}
])

// המוצרים הפופולריים ביותר (TOP 5)
db.carts.aggregate([
  {$unwind: "$items"},
  {$group: {_id: "$items.product", totalOrdered: {$sum: "$items.quantity"}}},
  {$sort: {totalOrdered: -1}},
  {$limit: 5}
])

// מוצרים שמעולם לא הוזמנו
db.products.aggregate([
  {$lookup: {
    from: "carts",
    let: {productId: "$_id"},
    pipeline: [
      {$unwind: "$items"},
      {$match: {$expr: {$eq: ["$items.product", "$$productId"]}}}
    ],
    as: "orders"
  }},
  {$match: {"orders": {$size: 0}}},
  {$project: {name: 1, price: 1, sku: 1}}
])
```

### אנליטיקה של עגלות
```javascript
// התפלגות גדלי עגלות
db.carts.aggregate([
  {$bucket: {
    groupBy: {$size: "$items"},
    boundaries: [0, 1, 3, 5, 10, 20],
    default: "20+",
    output: {count: {$sum: 1}, avgTotal: {$avg: "$total"}}
  }}
])

// התפלגות סכומי עגלות
db.carts.aggregate([
  {$bucket: {
    groupBy: "$total",
    boundaries: [0, 100, 500, 1000, 2000, 5000],
    default: "5000+",
    output: {count: {$sum: 1}}
  }}
])

// עגלות לפי יום בשבוע
db.carts.aggregate([
  {$group: {
    _id: {$dayOfWeek: "$createdAt"},
    count: {$sum: 1},
    avgTotal: {$avg: "$total"}
  }},
  {$sort: {_id: 1}}
])
```

---

## 🧹 **פעולות ניקוי ועריכה**

### מחיקת עגלות
```javascript
// מחיקת עגלות ריקות
db.carts.deleteMany({$or: [
  {items: {$size: 0}},
  {items: {$exists: false}}
]})

// מחיקת עגלות ישנות (מעל שבוע)
db.carts.deleteMany({
  updatedAt: {$lt: new Date(Date.now() - 7*24*60*60*1000)}
})

// מחיקת עגלות עם סכום 0
db.carts.deleteMany({total: {$lte: 0}})

// מחיקת עגלה ספציפית
db.carts.deleteOne({sessionId: "guest-specific-session-id"})
```

### עדכון נתונים
```javascript
// עדכון מחיר מוצר בכל העגלות
db.carts.updateMany(
  {"items.product": ObjectId("690ba54df1849f6b3392ec82")},
  {$set: {"items.$.price": 1299}}
)

// הוספת שדה חדש לכל המוצרים
db.products.updateMany({}, {$set: {discount: 0, tags: []}})

// עדכון מלאי מוצר (הפחתה)
db.products.updateOne({sku: "LEG-1"}, {$inc: {stock: -1}})

// סימון מוצר כלא פעיל
db.products.updateOne({sku: "LEG-1"}, {$set: {isActive: false}})

// עדכון קטגוריה
db.products.updateMany({category: "smartphone"}, {$set: {category: "smartphones"}})
```

### תיקון נתונים
```javascript
// חישוב מחדש של סכום עגלה
db.carts.find().forEach(function(cart) {
  var newTotal = 0;
  if (cart.items) {
    cart.items.forEach(function(item) {
      newTotal += item.quantity * item.price;
    });
    db.carts.updateOne({_id: cart._id}, {$set: {total: newTotal}});
  }
})

// הוספת timestamps למוצרים שחסרים
db.products.updateMany(
  {createdAt: {$exists: false}},
  {$set: {createdAt: new Date(), updatedAt: new Date()}}
)
```

---

## 📊 **סטטיסטיקות ודוחות**

### סטטיסטיקות כלליות
```javascript
// סטטיסטיקות מסד הנתונים
db.stats()

// סטטיסטיקות קולקשן
db.products.stats()
db.carts.stats()

// גודל הנתונים
db.runCommand({collStats: "products"})
db.runCommand({collStats: "carts"})

// אינדקסים
db.products.getIndexes()
db.carts.getIndexes()
```

### דוחות עסקיים
```javascript
// דוח מכירות כללי
db.carts.aggregate([
  {$group: {
    _id: null,
    totalCarts: {$sum: 1},
    totalRevenue: {$sum: "$total"},
    avgCartValue: {$avg: "$total"},
    totalItems: {$sum: {$size: "$items"}},
    maxCartValue: {$max: "$total"},
    minCartValue: {$min: "$total"}
  }}
])

// דוח מוצרים
db.products.aggregate([
  {$group: {
    _id: "$category",
    productCount: {$sum: 1},
    avgPrice: {$avg: "$price"},
    totalStock: {$sum: "$stock"},
    maxPrice: {$max: "$price"},
    minPrice: {$min: "$price"}
  }},
  {$sort: {productCount: -1}}
])

// דוח פעילות יומית
db.carts.aggregate([
  {$group: {
    _id: {
      year: {$year: "$createdAt"},
      month: {$month: "$createdAt"},
      day: {$dayOfMonth: "$createdAt"}
    },
    cartsCreated: {$sum: 1},
    totalRevenue: {$sum: "$total"}
  }},
  {$sort: {"_id.year": -1, "_id.month": -1, "_id.day": -1}},
  {$limit: 30}
])
```

### KPI מפתח
```javascript
// Conversion Rate מוקרב (עגלות עם פריטים vs ריקות)
db.carts.aggregate([
  {$facet: {
    "withItems": [{$match: {"items.0": {$exists: true}}}, {$count: "count"}],
    "total": [{$count: "count"}]
  }},
  {$project: {
    conversionRate: {
      $multiply: [
        {$divide: [
          {$arrayElemAt: ["$withItems.count", 0]},
          {$arrayElemAt: ["$total.count", 0]}
        ]}, 100
      ]
    }
  }}
])

// Average Order Value (AOV)
db.carts.aggregate([
  {$match: {"items.0": {$exists: true}, total: {$gt: 0}}},
  {$group: {_id: null, averageOrderValue: {$avg: "$total"}}}
])

// Items per Cart
db.carts.aggregate([
  {$match: {"items.0": {$exists: true}}},
  {$group: {_id: null, avgItemsPerCart: {$avg: {$size: "$items"}}}}
])
```

---

## 💻 **פקודות מהירות לטרמינל**

### בדיקות מהירות
```bash
# ספירה מהירה
mongosh simple_shop --eval "print('מוצרים: ' + db.products.countDocuments()); print('עגלות: ' + db.carts.countDocuments())"

# רשימת מוצרים
mongosh simple_shop --eval "db.products.find().forEach(p => print(p.name + ' - $' + p.price + ' (' + p.sku + ')'))"

# סכום כל העגלות
mongosh simple_shop --eval "db.carts.aggregate([{\$group: {_id: null, total: {\$sum: '\$total'}}}]).forEach(printjson)"

# עגלות אחרונות
mongosh simple_shop --eval "db.carts.find().sort({updatedAt: -1}).limit(5).forEach(c => print('Session: ' + c.sessionId + ' | Total: $' + c.total + ' | Items: ' + (c.items ? c.items.length : 0)))"

# מוצרים פופולריים
mongosh simple_shop --eval "db.carts.aggregate([{\$unwind: '\$items'}, {\$group: {_id: '\$items.product', count: {\$sum: 1}}}, {\$sort: {count: -1}}, {\$limit: 5}]).forEach(printjson)"
```

### ניקוי מהיר
```bash
# ניקוי עגלות ישנות
mongosh simple_shop --eval "print('נמחקו ' + db.carts.deleteMany({updatedAt: {\$lt: new Date(Date.now() - 7*24*60*60*1000)}}).deletedCount + ' עגלות ישנות')"

# ניקוי עגלות ריקות
mongosh simple_shop --eval "print('נמחקו ' + db.carts.deleteMany({items: {\$size: 0}}).deletedCount + ' עגלות ריקות')"

# עדכון timestamps
mongosh simple_shop --eval "print('עודכנו ' + db.products.updateMany({updatedAt: {\$exists: false}}, {\$set: {updatedAt: new Date()}}).modifiedCount + ' מוצרים')"
```

### בדיקות יומיות
```bash
# דוח יומי
mongosh simple_shop --eval "
var today = new Date();
today.setHours(0,0,0,0);
var todayCarts = db.carts.countDocuments({createdAt: {\$gte: today}});
var todayRevenue = db.carts.aggregate([{\$match: {createdAt: {\$gte: today}}}, {\$group: {_id: null, total: {\$sum: '\$total'}}}]).toArray();
print('=== דוח יומי ===');
print('עגלות היום: ' + todayCarts);
print('הכנסות היום: $' + (todayRevenue[0] ? todayRevenue[0].total : 0));
"

# בדיקת בעיות
mongosh simple_shop --eval "
print('=== בדיקת בעיות ===');
print('עגלות עם סכום 0: ' + db.carts.countDocuments({total: {$lte: 0}}));
print('מוצרים ללא מלאי: ' + db.products.countDocuments({stock: {$lte: 0}}));
print('מוצרים לא פעילים: ' + db.products.countDocuments({isActive: false}));
"
```

---

## 🔴 **Redis Commands**

### בדיקות בסיסיות
```bash
# בדיקת חיבור
redis-cli ping

# מידע כללי
redis-cli info
redis-cli info memory
redis-cli info clients

# כל המפתחות
redis-cli keys "*"

# מפתחות עגלה
redis-cli keys "cart:*"
redis-cli keys "cart:guest:*"
redis-cli keys "cart:user:*"
```

### עבודה עם Cache
```bash
# הצגת עגלה
redis-cli get "cart:guest:test123"
redis-cli hgetall "cart:guest:test123"

# TTL (זמן פקיעה)
redis-cli ttl "cart:guest:test123"

# מחיקת מפתח ספציפי
redis-cli del "cart:guest:test123"

# מחיקת כל הcache
redis-cli flushall

# מחיקת כל מפתחות עגלה
redis-cli eval "return redis.call('del', unpack(redis.call('keys', 'cart:*')))" 0
```

### מידע ואנליטיקה
```bash
# כמה מפתחות יש
redis-cli eval "return #redis.call('keys', '*')" 0

# גודל זיכרון של מפתח
redis-cli memory usage "cart:guest:test123"

# סטטיסטיקות זיכרון
redis-cli info memory | findstr used_memory_human
```

---

## 🌐 **API Testing עם curl**

### Health Checks
```bash
# בדיקת בריאות
curl http://localhost:4001/api/health

# בדיקת שרת
curl -I http://localhost:4001/

# בדיקת CORS
curl -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS http://localhost:4001/api/products
```

### Products API
```bash
# כל המוצרים
curl http://localhost:4001/api/products

# מוצר ספציפי (החלף ID)
curl http://localhost:4001/api/products/690ba54df1849f6b3392ec82

# מוצרים לפי קטגוריה
curl "http://localhost:4001/api/products?category=smartphones"

# חיפוש מוצרים
curl "http://localhost:4001/api/products?search=iPhone"
```

### Cart API
```bash
# קבלת עגלה
curl "http://localhost:4001/api/cart?sessionId=test123"

# ספירת פריטים בעגלה
curl "http://localhost:4001/api/cart/count?sessionId=test123"

# הוספה לעגלה
curl -X POST "http://localhost:4001/api/cart/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"test123\",\"productId\":\"690ba54df1849f6b3392ec82\",\"quantity\":1}"

# עדכון כמות
curl -X PUT "http://localhost:4001/api/cart/update" ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"test123\",\"productId\":\"690ba54df1849f6b3392ec82\",\"quantity\":3}"

# הסרת פריט
curl -X DELETE "http://localhost:4001/api/cart/remove" ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"test123\",\"productId\":\"690ba54df1849f6b3392ec82\"}"

# ריקון עגלה
curl -X DELETE "http://localhost:4001/api/cart/clear" ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"test123\"}"
```

### בדיקת שגיאות
```bash
# מוצר לא קיים
curl http://localhost:4001/api/products/invalid-id

# הוספה ללא sessionId
curl -X POST "http://localhost:4001/api/cart/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"productId\":\"690ba54df1849f6b3392ec82\",\"quantity\":1}"

# כמות לא תקינה
curl -X POST "http://localhost:4001/api/cart/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"test123\",\"productId\":\"690ba54df1849f6b3392ec82\",\"quantity\":-1}"
```

---

## 🔧 **פקודות דיבוג מערכת**

### בדיקת פורטים ותהליכים
```bash
# מי משתמש בפורט 4001
netstat -ano | findstr :4001

# MongoDB פורט
netstat -ano | findstr :27017

# Redis פורט
netstat -ano | findstr :6379

# כל תהליכי Node.js
tasklist | findstr node

# כל תהליכי MongoDB
tasklist | findstr mongo

# סגירת תהליך (החלף PID)
taskkill /F /PID 1234
```

### בדיקת קבצי Log
```bash
# לוגים של MongoDB
mongosh --eval "db.adminCommand('getLog', 'global').log.slice(-10).forEach(print)"

# מידע על חיבורים פעילים
mongosh --eval "db.serverStatus().connections"

# בדיקת פעילות הרשת
mongosh --eval "db.serverStatus().network"
```

### בדיקות ביצועים
```bash
# זמן תגובה של MongoDB
mongosh simple_shop --eval "var start = Date.now(); db.products.countDocuments(); print('MongoDB response time: ' + (Date.now() - start) + 'ms')"

# זמן תגובה של Redis
redis-cli --latency -i 1

# זמן תגובה של API
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4001/api/health
```

---

## 🚀 **סקריפטים מועילים**

### סקריפט בדיקה יומי
```bash
@echo off
echo === בדיקה יומית של המערכת ===
echo.

echo בודק MongoDB...
mongosh simple_shop --eval "print('מוצרים: ' + db.products.countDocuments()); print('עגלות: ' + db.carts.countDocuments())"

echo.
echo בודק Redis...
redis-cli ping

echo.
echo בודק API...
curl -s http://localhost:4001/api/health | findstr healthy

echo.
echo === הבדיקה הושלמה ===
pause
```

### סקריפט ניקוי שבועי
```bash
@echo off
echo === ניקוי שבועי של המערכת ===
echo.

echo מנקה עגלות ישנות...
mongosh simple_shop --eval "print('נמחקו ' + db.carts.deleteMany({updatedAt: {$lt: new Date(Date.now() - 7*24*60*60*1000)}}).deletedCount + ' עגלות ישנות')"

echo מנקה Cache...
redis-cli flushall

echo === הניקוי הושלם ===
pause
```

---

## 📝 **טיפים ושימושים מתקדמים**

### שדרוגי Performance
```javascript
// יצירת אינדקסים
db.products.createIndex({sku: 1})
db.products.createIndex({category: 1, price: 1})
db.carts.createIndex({sessionId: 1})
db.carts.createIndex({updatedAt: 1})

// בדיקת query performance
db.products.find({category: "smartphones"}).explain("executionStats")
```

### גיבוי ושחזור
```bash
# גיבוי המסד
mongodump --db simple_shop --out ./backup

# שחזור המסד
mongorestore --db simple_shop ./backup/simple_shop

# ייצוא לJSON
mongoexport --db simple_shop --collection products --out products.json

# ייבוא מJSON
mongoimport --db simple_shop --collection products --file products.json
```

---

**💡 טיפ:** שמור את הקובץ הזה כסימניית עבודה וחזור אליו בכל פעם שאתה צריך לבדוק או לנהל את המסד!