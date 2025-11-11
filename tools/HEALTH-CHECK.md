# 🔍 כלי בדיקת בריאות המערכת

כלי אוטומטי לבדיקת כל נקודות הקצה ומצב המערכת.

## 🚀 איך להשתמש

### הרצה מהירה
```bash
node health-check.js
```

### עם npm
```bash
npm run health
# או
npm run check
```

### Windows - לחיצת כפתור
- לחץ פעמיים על `health-check.bat`
- או לחץ פעמיים על `health-check.ps1`

## 📊 מה הכלי בודק

### 📡 חיבורים
- ✅ שרת API (port 3000)
- ✅ שרת פרונט (port 5173)

### 🏥 נקודות קצה - בריאות
- `GET /api/health` - בדיקה בסיסית
- `GET /api/health/detailed` - בדיקה מפורטת

### 📦 נקודות קצה - מוצרים
- `GET /api/products` - כל המוצרים
- `GET /api/products/1` - מוצר ספציפי
- `GET /api/products/999999` - בדיקת שגיאה (404)

### 🛒 נקודות קצה - עגלה
- `GET /api/cart/:sessionId` - קבלת עגלה
- `POST /api/cart/add` - הוספת מוצר
- `PUT /api/cart/update` - עדכון כמות
- `DELETE /api/cart/remove` - הסרת מוצר
- `POST /api/cart/clear` - ניקוי עגלה

## 🎨 פלטים צבעוניים

- 🟢 **ירוק**: הכל עובד מצוין
- 🟡 **צהוב**: יש כמה בעיות קלות
- 🔴 **אדום**: בעיות משמעותיות

## 📈 דוח סיכום

הכלי מציג:
- כמות endpoints שעובדים vs לא עובדים
- אחוז הצלחה
- הערכת מצב כללי
- טיפים לפתרון בעיות

## ⚙️ התאמה אישית

ניתן לשנות הגדרות ב-`health-check.js`:

```javascript
const config = {
  server: {
    host: 'localhost',
    port: 3000,        // שנה פורט שרת
    timeout: 5000      // timeout בדיקות
  },
  client: {
    host: 'localhost', 
    port: 5173,        // שנה פורט לקוח
    timeout: 3000
  }
};
```

## 🔧 פתרון בעיות נפוצות

### "Server Not Connected"
1. וודא שהשרת רץ: `cd server && npm run dev`
2. בדוק MongoDB: `mongo`
3. בדוק Redis: `redis-cli ping`

### "Client Not Connected"  
1. וודא שהלקוח רץ: `cd client && npm run dev`
2. בדוק שהפורט פנוי

### "API Endpoints Failing"
1. בדוק לוגים של השרת
2. וודא שמסד הנתונים מחובר
3. בדוק שיש נתונים לדוגמה: `npm run seed`

## 🎯 שימושים נוספים

- **CI/CD**: השתמש בכלי לבדיקות אוטומטיות
- **Monitoring**: הרץ כל כמה דקות
- **Debug**: זהה בעיות מהר
- **Demo**: הכן מראש לפני הצגה

## 📝 לוגים מפורטים

הכלי שומר מידע על:
- זמן תגובה לכל endpoint
- סטטוס קודים
- הודעות שגיאה
- נתוני התשובה

זה מושלם לזיהוי בעיות ביצועים!