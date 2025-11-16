# 🚀 Full-Stack Development Cheat Sheet
*כל מה שצריך לדעת כדי להבין את הפרויקט*

---

## 📋 **תוכן עניינים**
1. [JavaScript ES6+](#javascript-es6)
2. [Node.js Basics](#nodejs-basics)
3. [Express.js](#expressjs)
4. [MongoDB + Mongoose](#mongodb--mongoose)
5. [Redis](#redis)
6. [TypeScript](#typescript)
7. [React Basics](#react-basics)
8. [Redux Toolkit](#redux-toolkit)
9. [RTK Query](#rtk-query)
10. [Tailwind CSS](#tailwind-css)
11. [Tools](#tools)

---

## 🟨 **JavaScript ES6+**

### **Promises & Async/Await**
```javascript
// Promise (הבטחה) - פעולה שלוקחת זמן
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("הצלחנו!"), 1000);
});

// Async/Await - דרך נקייה לכתוב קוד אסינכרוני
async function fetchData() {
  try {
    const result = await fetch('/api/products');
    const data = await result.json();
    return data;
  } catch (error) {
    console.error('שגיאה:', error);
  }
}

// שימוש בפרויקט שלנו:
const products = await listProducts(); // חכה עד שהמוצרים יגיעו מה-DB
```

### **Destructuring (פירוק)**
```javascript
// פירוק אובייקטים
const user = { name: 'John', age: 25, city: 'Tel Aviv' };
const { name, age } = user; // name = 'John', age = 25

// פירוק מערכים
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers; // first = 1, second = 2, rest = [3,4,5]

// בפרויקט שלנו:
const { id } = req.params; // לוקח את ה-id מה-URL
const { data: products = [] } = useGetProductsQuery(); // RTK Query
```

### **Template Literals (מחרוזות תבנית)**
```javascript
const name = 'שמואל';
const message = `שלום ${name}!`; // במקום: 'שלום ' + name + '!'

// בפרויקט:
query: (id) => `products/${id}` // ל-API call
```

### **Arrow Functions (פונקציות חץ)**
```javascript
// רגילה
function add(a, b) { return a + b; }

// חץ
const add = (a, b) => a + b;

// עם בלוק
const processData = (data) => {
  console.log('עיבוד נתונים...');
  return data.map(item => item.toUpperCase());
};

// בפרויקט:
products.map((product) => <ProductCard key={product._id} product={product} />)
```

### **Modules (מודולים)**
```javascript
// ייצוא (Export)
export const API_URL = 'http://localhost:4000';
export function helper() { /* ... */ }
export default MyComponent;

// ייבוא (Import)
import React from 'react';
import { useState, useEffect } from 'react';
import MyComponent from './MyComponent';
```

---

## 🟦 **Node.js Basics**

### **Modules (מודולים)**
```javascript
// CommonJS (ישן)
const express = require('express');
module.exports = { app };

// ES6 Modules (חדש - מה שאנחנו משתמשים)
import express from 'express';
export { app };
```

### **NPM Scripts**
```json
{
  "scripts": {
    "dev": "ts-node-dev src/server.ts",    // פיתוח
    "build": "tsc",                        // בנייה
    "start": "node dist/server.js",        // הפעלה
    "test": "jest",                        // טסטים
    "seed": "ts-node src/seed/products.seed.ts" // זריעת נתונים
  }
}
```

### **Environment Variables (משתני סביבה)**
```javascript
// .env file
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/mydb

// בקוד:
process.env.PORT // "4000"
process.env.NODE_ENV // "development"
```

---

## 🟩 **Express.js**

### **Basic Server**
```javascript
import express from 'express';

const app = express();

// Middlewares (פונקציות ביניים)
app.use(express.json());        // פרסר JSON
app.use(cors());               // אישור CORS

// Routes (נתיבים)
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: [] });
});

app.listen(4000, () => console.log('Server running on port 4000'));
```

### **Request & Response**
```javascript
// Request - מידע מהלקוח
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;        // מה-URL: /api/products/123
  const { search } = req.query;     // מה-URL: ?search=iphone
  const body = req.body;            // מה-POST body
  const auth = req.headers.authorization; // מה-headers
});

// Response - תגובה ללקוח
res.status(200).json({ data: products }); // הצלחה
res.status(404).json({ error: 'Not found' }); // לא נמצא
res.status(500).json({ error: 'Server error' }); // שגיאת שרת
```

### **Middleware**
```javascript
// Middleware פונקציה שרצה לפני הroute
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  // וידוא הטוקן...
  next(); // המשך לroute הבא
};

// שימוש:
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'מוגן!' });
});
```

---

## 🟫 **MongoDB + Mongoose**

### **Schema Definition**
```javascript
import { Schema, model } from 'mongoose';

// הגדרת מבנה
const productSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true }); // createdAt, updatedAt אוטומטי

export const ProductModel = model('Product', productSchema);
```

### **Database Operations**
```javascript
// יצירה
const product = new ProductModel({ sku: 'LEG-1', name: 'iPhone', price: 999 });
await product.save();

// חיפוש
const products = await ProductModel.find({ isActive: true }); // כל הפעילים
const product = await ProductModel.findById('60f7b3b3b3b3b3b3b3b3b3b3'); // לפי ID
const iphones = await ProductModel.find({ name: /iPhone/i }); // חיפוש טקסט

// עדכון
await ProductModel.findByIdAndUpdate(id, { price: 899 });

// מחיקה
await ProductModel.findByIdAndDelete(id);

// שאילתות מתקדמות
const featured = await ProductModel
  .find({ featured: true })
  .sort({ price: -1 })  // מיון לפי מחיר יורד
  .limit(10)           // 10 ראשונים
  .lean();             // JSON פשוט (מהיר יותר)
```

---

## 🟥 **Redis**

### **Basic Operations**
```javascript
import Redis from 'ioredis';

const redis = new Redis('redis://localhost:6379');

// Set/Get פשוט
await redis.set('key', 'value');
const value = await redis.get('key');

// JSON Objects
await redis.set('user:123', JSON.stringify({ name: 'John', age: 30 }));
const user = JSON.parse(await redis.get('user:123'));

// TTL (Time To Live)
await redis.setex('session:abc', 3600, 'user123'); // יפוג בעוד שעה

// Hash (לעגלת קניות)
await redis.hset('cart:user123', 'product1', '2'); // 2 יחידות
await redis.hset('cart:user123', 'product2', '1'); // 1 יחידה
const cart = await redis.hgetall('cart:user123'); // כל העגלה
```

---

## 🔷 **TypeScript**

### **Basic Types**
```typescript
// סוגים בסיסיים
let name: string = 'John';
let age: number = 25;
let isActive: boolean = true;
let numbers: number[] = [1, 2, 3];

// Union Types
let id: string | number = '123'; // או מחרוזת או מספר

// Optional Properties
interface User {
  name: string;
  age?: number; // אופציונלי
}
```

### **Interfaces**
```typescript
// הגדרת מבנה נתונים
interface Product {
  _id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
}

// שימוש
const product: Product = {
  _id: '123',
  sku: 'LEG-1',
  name: 'iPhone',
  price: 999,
  category: 'smartphones',
  stock: 50,
  isActive: true
};
```

### **Generics**
```typescript
// פונקציה גנרית
function wrapResponse<T>(data: T): { success: boolean; data: T } {
  return { success: true, data };
}

// שימוש
const productResponse = wrapResponse<Product[]>(products);
const userResponse = wrapResponse<User>(user);

// API Response Type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

---

## ⚛️ **React Basics**

### **Components**
```tsx
import React from 'react';

// Functional Component (מה שאנחנו משתמשים)
interface Props {
  title: string;
  count?: number;
}

const MyComponent: React.FC<Props> = ({ title, count = 0 }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  );
};

export default MyComponent;
```

### **Hooks**
```tsx
import { useState, useEffect } from 'react';

function ProductList() {
  // State - מצב הקומפוננט
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Effect - פעולה שקורית בזמנים מסויימים
  useEffect(() => {
    // רץ כשהקומפוננט נטען
    fetchProducts();
  }, []); // [] = רק פעם אחת

  const fetchProducts = async () => {
    setLoading(true);
    const data = await fetch('/api/products').then(res => res.json());
    setProducts(data);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### **Event Handling**
```tsx
function Button() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Button clicked!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // טיפול בטופס
  };

  return (
    <form onSubmit={handleSubmit}>
      <button onClick={handleClick}>Click me!</button>
    </form>
  );
}
```

---

## 🔄 **Redux Toolkit**

### **Store Setup**
```typescript
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    products: productsSlice.reducer,
    cart: cartSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### **Slice (חלק מה-state)**
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  items: CartItem[];
  total: number;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 } as CartState,
  reducers: {
    addItem: (state, action: PayloadAction<Product>) => {
      state.items.push({
        product: action.payload,
        quantity: 1
      });
      state.total += action.payload.price;
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(item => item.product._id === action.payload);
      if (index >= 0) {
        state.total -= state.items[index].product.price * state.items[index].quantity;
        state.items.splice(index, 1);
      }
    }
  }
});

export const { addItem, removeItem } = cartSlice.actions;
```

---

## 🔗 **RTK Query**

### **API Definition**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:4000/api/',
  }),
  tagTypes: ['Product', 'Cart'],
  endpoints: (builder) => ({
    // GET Products
    getProducts: builder.query<Product[], void>({
      query: () => 'products',
      providesTags: ['Product'],
    }),
    
    // POST Add to Cart
    addToCart: builder.mutation<CartResponse, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url: 'cart',
        method: 'POST',
        body: { productId, quantity },
      }),
      invalidatesTags: ['Cart'], // רענן את העגלה אחרי הוספה
    }),
  }),
});

export const { useGetProductsQuery, useAddToCartMutation } = api;
```

### **Using in Components**
```tsx
function ProductList() {
  // Query - אוטומטי, cache, loading states
  const { data: products = [], isLoading, error } = useGetProductsQuery();
  
  // Mutation - ידני, לפעולות שמשנות נתונים
  const [addToCart] = useAddToCartMutation();

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      alert('נוסף לעגלה!');
    } catch (error) {
      alert('שגיאה בהוספה');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>
          <h3>{product.name}</h3>
          <button onClick={() => handleAddToCart(product)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 **Tailwind CSS**

### **Common Classes**
```html
<!-- Layout -->
<div class="container mx-auto">        <!-- מרכז עם padding -->
<div class="flex justify-between">     <!-- flexbox עם הצדקה -->
<div class="grid grid-cols-3 gap-4">  <!-- grid 3 עמודות -->

<!-- Spacing -->
<div class="p-4">      <!-- padding: 1rem -->
<div class="m-8">      <!-- margin: 2rem -->
<div class="px-4 py-2"> <!-- padding x: 1rem, y: 0.5rem -->

<!-- Colors -->
<div class="bg-blue-500">      <!-- רקע כחול -->
<div class="text-white">       <!-- טקסט לבן -->
<div class="border-gray-300">  <!-- גבול אפור -->

<!-- Typography -->
<h1 class="text-2xl font-bold">        <!-- גדול ועבה -->
<p class="text-sm text-gray-600">      <!-- קטן ואפור -->

<!-- Responsive -->
<div class="sm:text-lg md:text-xl lg:text-2xl"> <!-- גדלים שונים -->
<div class="hidden md:block">                   <!-- הסתר במובייל -->
```

### **Custom Components**
```tsx
// Button Component
const Button: React.FC<{ variant?: 'primary' | 'secondary' }> = ({ 
  children, 
  variant = 'primary' 
}) => {
  const baseClasses = "px-4 py-2 rounded transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900"
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};
```

---

## 🛠️ **Tools**

### **Git Commands**
```bash
# בסיסי
git init                    # התחל repository
git add .                   # הוסף כל הקבצים
git commit -m "הודעה"       # שמור שינויים
git push                    # העלה לGitHub
git pull                    # הורד מGitHub

# Branches
git branch feature/cart     # צור branch חדש
git checkout feature/cart   # עבור ל-branch
git merge feature/cart      # מזג branch

# History
git log                     # היסטוריית commits
git diff                    # מה השתנה
git status                  # מצב נוכחי
```

### **NPM Commands**
```bash
npm init -y                 # צור package.json
npm install express         # התקן חבילה
npm install -D @types/node  # התקן לפיתוח בלבד
npm run dev                 # הרץ script
npm test                    # הרץ טסטים
npm run build              # בנה לproduction
```

### **Chrome DevTools**
```
F12                        # פתח DevTools
Console tab                # JavaScript console
Network tab               # בקשות HTTP
Elements tab              # HTML/CSS
Application tab           # localStorage, cookies
Sources tab               # debug JavaScript
```

---

## 🎯 **מקרי שימוש נפוצים בפרויקט**

### **Server: Add new API endpoint**
```typescript
// 1. Service
export async function getProductsByCategory(category: string) {
  return ProductModel.find({ category, isActive: true }).lean();
}

// 2. Controller
export async function getProductsByCategory(req: Request, res: Response) {
  const { category } = req.params;
  const products = await getProductsByCategory(category);
  res.json(ok(products));
}

// 3. Route
router.get('/category/:category', getProductsByCategory);
```

### **Client: Add new component**
```tsx
// 1. Component
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <img src={product.image} alt={product.name} />
      <h3 className="font-bold">{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
};

// 2. Use in parent
<ProductCard product={product} onAddToCart={handleAddToCart} />
```

---

## 🔍 **איך למצוא מידע**

### **בעיות נפוצות**
- **CORS Error:** הוסף `app.use(cors())` בserver
- **404 Error:** בדוק נתיבי API וURLs
- **TypeScript Errors:** בדוק types וinterfaces
- **React re-render:** בדוק dependencies של useEffect
- **Redux not updating:** בדוק אם קראת לaction

### **משאבים מהירים**
- **MDN Web Docs:** JavaScript, Web APIs
- **React Docs:** Components, hooks, patterns
- **Express Docs:** Routing, middleware
- **Mongoose Docs:** Schema, queries
- **Tailwind Docs:** Classes, utilities
- **TypeScript Handbook:** Types, interfaces

### **Debug Tips**
```javascript
// הוסף בכל מקום שאתה רוצה להבין מה קורה
console.log('🐛 Debug:', { variable, anotherVar });

// בReact components
console.log('🔄 Render:', { props, state });

// בAPI calls
console.log('📡 API Call:', { method, url, data });
```

---

## 🎉 **סיכום מהיר**

**זכור את הזרימה:**
1. **Client** שולח בקשה → **Server** מקבל → **Database** מחזיר נתונים
2. **Redux** מנהל state → **Components** מציגים UI → **User** לוחץ
3. **TypeScript** מוודא types → **Build tools** מכינים לproduction

**השתמש בcheat sheet הזה כדי:**
- ✅ להבין קוד קיים
- ✅ לכתוב קוד חדש
- ✅ לפתור בעיות
- ✅ ללמוד דברים חדשים

**זכור:** כשלא יודע משהו - חפש כאן ראשון! 🚀