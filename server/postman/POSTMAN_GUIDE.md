# 🚀 Postman Testing Guide - Simple Shop API

## 📦 התקנה וייבוא

### שלב 1: הורדת Postman
אם עדיין אין לך Postman:
- **Desktop App (מומלץ):** https://www.postman.com/downloads/
- **Web Version:** https://web.postman.com/

### שלב 2: ייבוא ה-Collection

1. **פתח את Postman**
2. **לחץ על Import** (בצד שמאל עליון)
3. **בחר אחת מהאפשרויות:**

   **אופציה A - Import מקובץ:**
   - גרור את הקובץ: `Simple-Shop-Complete-Collection.json`
   - או לחץ "Upload Files" ובחר אותו

   **אופציה B - Import מ-folder:**
   - לחץ "Folder"
   - בחר את התיקייה: `server/postman`

4. גקר**Import את ה-Environment (אופציונלי):**
   - Import גם את `Development.postman_environment.json`
   - בחר אותו מה-dropdown בצד ימין עליון

---

## 🎯 איך להשתמש - Quick Start

### ⚡ התחלה מהירה (3 דקות)

#### 1. הרץ את השרת
```bash
cd server
npm run dev
```

ודא שאתה רואה:
```
✅ MongoDB connected
✅ Redis connected  
🚀 Server running on http://localhost:4001
```

#### 2. בדוק שהשרת עובד
- פתח את **Health Check → Health Status**
- לחץ **Send**
- אמור לראות: ✅ Status 200

#### 3. התחבר למערכת
בחר אחד:

**אם אין לך משתמש:**
- פתח **Authentication → Register New User**
- ערוך את ה-body (שם, email, סיסמה)
- לחץ **Send**
- ✅ Token נשמר אוטומטית!

**אם יש לך משתמש:**
- פתח **Authentication → Login**
- ערוך email וסיסמה
- לחץ **Send**
- ✅ Token נשמר אוטומטית!

#### 4. בדוק מוצרים
- פתח **Products → Get All Products**
- לחץ **Send**
- ✅ רשימת מוצרים + שמירת Product ID אוטומטית!

#### 5. הוסף לעגלה
- פתח **Cart → Add to Cart**
- לחץ **Send** (ישתמש ב-productId שנשמר)
- ✅ מוצר נוסף לעגלה!

---

## 🔐 Authentication Flow

### איך ה-Token עובד?

1. **אחרי Login/Register:**
   - Token נשמר אוטומטית במשתנה `{{authToken}}`
   - כל ה-requests הבאים ישתמשו בו

2. **ה-Token מתווסף אוטומטית:**
   - הכל מוגדר ב-Collection level
   - אין צורך להוסיף headers ידנית!

3. **Token פג תוקף?**
   - עשה Login שוב
   - Token חדש יחליף את הישן

### בדיקה ידנית של Token:
```
Variables → authToken
```
אם אתה רואה שם token ארוך - אתה מחובר! ✅

---

## 📚 Collection Structure

```
🏥 Health Check
├── Health Status          - בדיקת MongoDB, Redis, Uptime
└── Ping                   - בדיקה מהירה

🔐 Authentication
├── Register New User      - יצירת משתמש חדש
├── Login                  - התחברות
├── Verify Token           - בדיקת תקינות token
├── Get Profile            - פרטי המשתמש
└── Logout                 - התנתקות

📦 Products
├── Get All Products       - רשימת מוצרים
├── Get Product by ID      - מוצר בודד
└── Search Products        - חיפוש וסינון

🛒 Cart
├── Get Cart               - קבלת עגלה
├── Add to Cart            - הוספת מוצר
├── Update Cart Item       - עדכון כמות
├── Remove from Cart       - הסרת מוצר
├── Clear Cart             - ריקון עגלה
└── Get Cart Count         - מספר פריטים
```

---

## 🎨 Features מיוחדות

### ✅ Auto Tests
כל request יש **Tests** אוטומטיים:
- בדיקת status code
- בדיקת structure של response
- שמירה אוטומטית של IDs למשתנים

**איך לראות:**
1. שלח request
2. לחץ על טאב **Test Results** (למטה)
3. תראה ✅ או ❌ לכל test

### 🔄 Auto-Save Variables
המערכת שומרת אוטומטית:
- `{{authToken}}` - אחרי login
- `{{userId}}` - ID של המשתמש
- `{{productId}}` - ID של מוצר ראשון
- `{{userEmail}}` - Email של המשתמש

### 📊 Console Logs
**איך לראות logs:**
1. View → Show Postman Console (Ctrl+Alt+C)
2. שלח request
3. תראה logs מפורטים:
   ```
   🎉 Logged in successfully!
   👤 User: test@example.com
   🔑 Token: eyJhbGc...
   ```

---

## 🛠️ Tips & Tricks

### 1. שינוי Port
אם השרת רץ על port אחר:
```
Variables → baseUrl → http://localhost:YOUR_PORT
```

### 2. הרצת כל ה-Tests
- לחץ על **Collection** (Simple Shop)
- לחץ **Run**
- בחר requests
- **Run Simple Shop**
- תראה ריפורט מלא! 📊

### 3. סביבות שונות (Dev, Staging, Prod)
צור environment חדש:
1. Environments → New Environment
2. שם: "Production"
3. `baseUrl`: `https://your-production-url.com`
4. החלף environment מה-dropdown

### 4. שימוש ב-Variables בכל מקום
בכל שדה אתה יכול להשתמש:
```
{{authToken}}
{{userId}}
{{productId}}
{{baseUrl}}
```

### 5. Pre-request Scripts
אם אתה רוצה לעשות משהו **לפני** request:
- טאב **Pre-request Script**
- כתוב JavaScript
- דוגמה: יצירת timestamp, hash, וכו'

---

## 🧪 Testing Scenarios

### סצנריו 1: משתמש חדש
```
1. Register New User
2. Get Profile ✅ (token נשמר אוטומטית)
3. Get All Products
4. Add to Cart
5. Get Cart
6. Logout
```

### סצנריו 2: משתמש קיים
```
1. Login
2. Get Cart (עגלה מהפעם הקודמת)
3. Update Cart Item
4. Remove from Cart
5. Clear Cart
```

### סצנריו 3: Guest → User
```
1. Get All Products (ללא login)
2. Add to Cart (guest cart)
3. Login
4. Cart Merge (אוטומטי בצד שרת)
5. Get Cart (עגלה ממוזגת)
```

---

## ❌ Troubleshooting

### בעיה: "Could not get any response"
**פתרון:**
- ודא שהשרת רץ (`npm run dev`)
- בדוק את ה-port ב-baseUrl
- בדוק firewall/antivirus

### בעיה: "401 Unauthorized"
**פתרון:**
- עשה Login שוב
- ודא ש-authToken לא ריק
- בדוק שה-token לא פג תוקף (7 ימים)

### בעיה: "Cannot read property _id"
**פתרון:**
- הרץ "Get All Products" תחילה
- זה שומר את productId למשתנה
- אחר כך Add to Cart יעבוד

### בעיה: Tests נכשלים
**פתרון:**
- בדוק את ה-Console (Ctrl+Alt+C)
- קרא את ההודעות
- לעיתים זה OK (למשל: user already exists)

---

## 📖 לקריאה נוספת

- [Postman Documentation](https://learning.postman.com/)
- [Writing Tests](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Variables](https://learning.postman.com/docs/sending-requests/variables/)
- [Environments](https://learning.postman.com/docs/sending-requests/managing-environments/)

---

## 🎉 סיכום

**המדריך הזה כולל:**
✅ Collection מלא עם כל ה-endpoints  
✅ Tests אוטומטיים לכל request  
✅ שמירה אוטומטית של tokens ו-IDs  
✅ Console logs מפורטים  
✅ Environment מוכן לשימוש  
✅ תיעוד מלא בעברית  

**עכשיו אתה יכול:**
- לבדוק את ה-API בקלות
- לראות אם הכל עובד
- להבין מה קורה בכל request
- לכתוב features חדשים ולבדוק מיד!

**Have fun! 🚀**
