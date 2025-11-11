# 🚨 Common Errors & Solutions
*פתרונות לבעיות הנפוצות ביותר*

## Server Errors

### CORS Error
```
Access to fetch at 'http://localhost:4001/api/products' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**פתרון:**
```javascript
// בserver/src/app.ts
import cors from 'cors';
app.use(cors()); // הוסף את זה לפני הroutes
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```
**פתרון:**
```bash
# שנה port
set PORT=4001 && npm run dev

# או הרוג תהליך קיים
netstat -ano | findstr :4000
taskkill /PID [מספר_התהליך] /F
```

### MongoDB Connection Failed
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```
**פתרון:**
1. ודא שMongoDB רץ
2. בדוק את MONGO_URI ב-.env
3. התקן MongoDB Community Server

## Client Errors

### Module Not Found
```
Cannot find module 'react' or its corresponding type declarations
```
**פתרון:**
```bash
cd client
npm install
# או אם זה types:
npm install -D @types/react @types/react-dom
```

### Hydration Error (React)
```
Warning: Text content did not match. Server: "0" Client: "3"
```
**פתרון:**
- בדוק שהserver וclient מחזירים אותו נתון
- השתמש ב-`useEffect` לדברים שמשתנים

### RTK Query Error
```
TypeError: Cannot read properties of undefined (reading 'data')
```
**פתרון:**
```tsx
// במקום:
const products = data.products;

// השתמש:
const { data: products = [] } = useGetProductsQuery();
```

## TypeScript Errors

### Type 'any' Not Allowed
**פתרון:**
```typescript
// במקום:
const handleClick = (e) => { ... }

// כתוב:
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### Property Does Not Exist
```
Property 'productId' does not exist on type 'unknown'
```
**פתרון:**
```typescript
// הגדר interface:
interface CartItem {
  productId: string;
  quantity: number;
}

const item: CartItem = { productId: '123', quantity: 1 };
```

## Build Errors

### Tailwind Not Working
**פתרון:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // ודא שהנתיב נכון
  ],
}

// src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Vite Build Failed
**פתרון:**
1. מחק node_modules: `rm -rf node_modules`
2. מחק package-lock.json
3. התקן מחדש: `npm install`
4. נסה לבנות: `npm run build`

## Network Errors

### API Call Failed
**Debug:**
1. פתח Network tab (F12)
2. בדוק status code: 200 = OK, 404 = Not Found, 500 = Server Error
3. בדוק Request URL
4. בדוק Response

**נפוצות:**
- 404: בדוק נתיב API
- 500: בדוק server logs
- CORS: הוסף cors middleware

## Git Issues

### Merge Conflicts
```
<<<<<<< HEAD
const port = 3000;
=======
const port = 4000;
>>>>>>> feature-branch
```
**פתרון:**
1. בחר איזה גרסה לשמור
2. מחק את הסימנים `<<<<<<<`, `=======`, `>>>>>>>`
3. `git add .` ו-`git commit`

## Quick Debug Checklist

### Server לא עובד:
- [ ] MongoDB רץ?
- [ ] Redis רץ?
- [ ] .env קיים?
- [ ] npm install רץ?
- [ ] Port פנוי?

### Client לא עובד:
- [ ] Server רץ?
- [ ] npm install רץ?
- [ ] API URLs נכונים?
- [ ] Console errors?
- [ ] Network tab?

### Data לא מגיע:
- [ ] Seed רץ?
- [ ] Database connection?
- [ ] API endpoint נכון?
- [ ] CORS מוגדר?
- [ ] TypeScript types?