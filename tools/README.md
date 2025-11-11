# 🛠️ כלי פיתוח TechBasket

תיקייה זו מכילה כלים שונים לפיתוח ותחזוקת הפרויקט.

## 🔍 כלי בדיקת בריאות המערכת

### הרצה מהירה
```bash
cd tools
node health-check.js
```

### לחיצת כפתור
- **Windows**: לחץ פעמיים על `health-check.bat`  
- **PowerShell**: לחץ פעמיים על `health-check.ps1`

### מה הכלי בודק
- ✅ חיבור לשרתים (API + Client)
- ✅ כל נקודות הקצה של API
- ✅ מצב המערכת הכללי
- 📊 דוח מפורט עם צבעים

### קבצים
- `health-check.js` - הכלי הראשי
- `health-check.bat` - הרצה בWindows  
- `health-check.ps1` - PowerShell מתקדם
- `HEALTH-CHECK.md` - תיעוד מלא

## 🚀 שימוש

```bash
# מהתיקיה הראשית של הפרויקט
./tools/health-check.bat

# או ממחשב אחר (עם שינוי כתובות)
cd tools
node health-check.js
```

## 📝 הוספת כלים נוספים

כלים חדשים שיתווספו בעתיד:
- 📊 כלי מעקב ביצועים
- 🧪 רצי בדיקות אוטומטיות  
- 📦 כלי פריסה
- 🔄 כלי עדכון dependencies