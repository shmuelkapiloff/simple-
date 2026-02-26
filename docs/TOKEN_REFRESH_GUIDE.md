# 🔐 מדריך מלא: Access + Refresh Tokens (אפשרות 3)

## 📌 סיכום התכונה

המערכת שלכם משתמשת ב-**2 סוגי Tokens** לאבטחה מקסימלית:

### 1️⃣ Access Token (טוקן גישה)
- ⏱️ **משך חיים**: 15 דקות בלבד
- 📦 **איפה שמורים**: `localStorage.accessToken`
- 🎯 **מה הוא עושה**: נשלח בכל בקשה לשרת (Authorization header)
- 🔒 **למה בטוח**: גם אם נגנב, הוא חסר תועלת אחרי 15 דקות

### 2️⃣ Refresh Token (טוקן רענון)
- ⏱️ **משך חיים**: 7 ימים
- 📦 **איפה שמורים**: `sessionStorage.refreshToken` (נמחק כשסוגרים דפדפן)
- 🎯 **מה הוא עושה**: משמש רק כדי לקבל Access Token חדש
- 🔒 **למה בטוח**: לא נשלח בכל בקשה, רק בשביל רענון

---

## 🔄 איך זה עובד מאחורי הקלעים?

```
1. משתמש מתחבר (Login)
   └─> שרת מחזיר: accessToken (15min) + refreshToken (7 days)
   └─> Client שומר: localStorage + sessionStorage

2. משתמש שולח בקשה (לדוגמה: GET /api/cart)
   └─> Headers: Authorization: Bearer <accessToken>
   └─> שרת בודק: Token תקף? ✅ → מחזיר נתונים

3. אחרי 15 דקות: Access Token פג תוקף
   └─> בקשה חדשה: GET /api/orders
   └─> שרת מחזיר: 401 Unauthorized ❌
   └─> 🔄 Interceptor מזהה אוטומטית!
      ├─> שולח refreshToken ל-POST /api/auth/refresh
      ├─> מקבל accessToken חדש (15 דקות נוספות)
      ├─> שומר ב-localStorage
      └─> חוזר ושולח את הבקשה המקורית ✅

4. משתמש לא מרגיש כלום! 🎉
```

---

## ✅ מה כבר מוכן בפרויקט (עשינו בשבילך)

### בשרת (Backend - Node.js):
✅ `JWT_EXPIRATION = 15m` (access token)  
✅ `JWT_REFRESH_EXPIRATION = 7d` (refresh token)  
✅ `POST /api/auth/login` → מחזיר שני tokens  
✅ `POST /api/auth/register` → מחזיר שני tokens  
✅ `POST /api/auth/refresh` → endpoint לרענון token  

### ב-Frontend (React):
✅ `authSlice.ts` → פונקציה `refreshAccessToken()` מוכנה  
✅ `api.ts` → Interceptor שמרענן token אוטומטית ב-401  
✅ `NavBar.tsx` → בודק `accessToken` במקום `token`  
✅ Login/Register → שומרים `accessToken` + `refreshToken`  
✅ Logout → מוחקים את שני הtokens  

---

## 🎯 מה צריך לבדוק שעובד?

### בדיקה 1: התחברות רגילה
```
1. עבור ל-/login
2. התחבר
3. פתח Console (F12) → Application → Local Storage
   ✅ accessToken יופיע
4. פתח Session Storage
   ✅ refreshToken יופיע
```

### בדיקה 2: רענון אוטומטי של Token
```
1. התחבר
2. פתח Console (F12) → Console
3. הזן:
   localStorage.setItem("accessToken", "invalid_token")
4. נסה לשלוח בקשה (לדוגמה: לך לדף העגלה)
5. תראה בקונסול:
   🔄 Token expired - attempting refresh...
   ✅ Token refreshed successfully - retrying request
6. הדף צריך לעבוד בלי שום בעיה!
```

### בדיקה 3: התנתקות
```
1. התחבר
2. לחץ "התנתק"
3. פתח Console → Application
   ✅ accessToken נמחק
   ✅ refreshToken נמחק
4. נסה לגשת לדף מוגן (לדוגמה: /orders)
   ✅ צריך לפתוח חלון התחברות
```

---

## 🚀 למה זה מרשים בהגנה על הפרויקט?

### תרחיש תקיפה:
**🎭 תסריט לבוחנים:**

> "אז מה קורה אם אקר גנב את הטוקן שלי?"

**תשובה שלך:**
> "במערכת שלנו, יש 2 סוגי tokens:
> 
> 1. Access Token חי רק 15 דקות. גם אם הוא נגנב, האקר יכול להשתמש בו רק עד שהוא פוקע.
> 2. Refresh Token שמור ב-sessionStorage, לא ב-localStorage. כלומר, הוא נמחק אוטומטית כשסוגרים את הדפדפן.
> 3. יש לנו Interceptor שבודק אוטומטית אם הטוקן פג תוקף ומרענן אותו בלי שהמשתמש ירגיש.
> 
> כך הפחתנו את חלון התקיפה מ-7 ימים ל-15 דקות. זה בדיוק מה שעושים בחברות כמו Google ו-Facebook."

**👏 הבוחנים יתרשמו מאוד!**

---

## 🐛 טיפים לדיבוג

### אם Token לא מתרענן:
```javascript
// הדבק בקונסול כדי לראות מה קורה:
console.log("Access Token:", localStorage.getItem("accessToken"));
console.log("Refresh Token:", sessionStorage.getItem("refreshToken"));
```

### אם יש שגיאת CORS:
וודא ש-`ALLOWED_ORIGINS` בשרת כולל את הכתובת של הקליינט שלך.

### אם משתמש מנותק אחרי רענון דפ:
זה נורמלי אם Refresh Token ב-sessionStorage!  
אם רוצים שהמשתמש יישאר מחובר גם אחרי רענון דף:
```javascript
// שנה ב-authSlice.ts:
sessionStorage.setItem("refreshToken", refreshToken);
// ל:
localStorage.setItem("refreshToken", refreshToken);
```
**⚠️ אבל זה פחות בטוח!**

---

## 📊 השוואה לשיטות אחרות

| תכונה | טוקן אחד | טוקן + Blacklist | Access + Refresh (שלכם) |
|--------|----------|------------------|-------------------------|
| זמן חיים של טוקן בזיכרון | 7 ימים | 7 ימים | 15 דקות |
| התנתקות עובדת | ❌ לא | ✅ כן | ✅ כן |
| רענון אוטומטי | ❌ לא | ❌ לא | ✅ כן |
| אבטחה | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| רמת מורכבות | פשוט | בינוני | מתקדם |

---

## 🎓 מה הבוחנים ישאלו?

### שאלה: "למה לא שמתם את הRefresh Token גם ב-localStorage?"
**תשובה:**  
> "sessionStorage נמחק כשסוגרים את הדפדפן, ולכן הוא בטוח יותר. אם האקר יגנוב אותו, הוא חייב לעבוד מהר לפני שהמשתמש יסגור את הדפדפן. זה מקטין עוד יותר את חלון התקיפה."

### שאלה: "מה קורה אם גם הRefresh Token פג תוקף?"
**תשובה:**  
> "אז המערכת מנתקת את המשתמש אוטומטית ומבקשת ממנו להתחבר מחדש. זה קורה רק אחרי 7 ימים של חוסר פעילות, אז זה מקרה קצה."

### שאלה: "למה לא להשתמש ב-httpOnly cookies?"
**תשובה:**  
> "httpOnly cookies הם הפתרון הכי בטוח, אבל דורשים CORS מורכב יותר. בפרויקט שלנו, sessionStorage + Access Token של 15 דקות נותנים לנו 90% מהאבטחה עם הרבה פחות סיבוכים."

---

## 🎉 סיכום

אתם עכשיו עם פתרון אבטחה ברמה תעשייתית:
✅ Access Token של 15 דקות  
✅ Refresh Token של 7 ימים  
✅ רענון אוטומטי עם Interceptor  
✅ sessionStorage למניעת גישה אחרי סגירת דפדפן  
✅ קוד נקי ומתועד  

**זה בדיוק מה שהבוחנים רוצים לראות!** 🎯

---

**נכתב במיוחד עבור פרויקט גמר** 💻  
**גרסה: 1.0 | תאריך: 26.02.2026**
