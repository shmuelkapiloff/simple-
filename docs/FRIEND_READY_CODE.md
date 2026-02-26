# 🎁 קוד מוכן לחברך - Access + Refresh Tokens

זה קוד שחברך יכול להדביק **בדיוק כמו שהוא** ללא שום שינויים!

---

## 🔍 בחר את הטכנולוגיה שלך

**האם משתמש ב-:**
- [Fetch API פשוט](#-option-1-fetch-api-פשוט) ← יותר פשוט
- [Axios](#-option-2-axios) ← עם Interceptors
- [RTK Query](#-option-3-rtk-query) ← עם Redux

---

## 🌟 Option 1: Fetch API פשוט

**זה עובד אם:**
- משתמש ב-React בלי Redux
- משתמש `useState` וא `useEffect`
- קוראים לשרת עם `fetch()`

### 📁 יצור קובץ: `src/utils/api.js`

```javascript
// קבע את כתובת השרת
const API_BASE_URL = "http://localhost:4001/api/";

/**
 * 🔐 פונקציה לרענן Token
 * כשה-Access Token פג תוקף, קורים לפונקציה הזאת
 */
async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.log("❌ אין Refresh Token - צריך התחברות מחדש");
    logout();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.log("❌ Refresh Token לא עובד - צריך התחברות מחדש");
      logout();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data?.data?.token;

    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      console.log("✅ Token רוענן בהצלחה");
      return newAccessToken;
    }
  } catch (error) {
    console.error("❌ שגיאה ברענון Token:", error);
    logout();
    return null;
  }
}

/**
 * 🎯 פונקציה כללית לבקשות API
 * משתמשים בפונקציה הזאת בכל מקום שקוראים לשרת
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = localStorage.getItem("accessToken");

  // דברים שהתחברנו, הוסף token לכל בקשה
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // 🔄 אם Token פג (401), נסה לרענן
    if (response.status === 401) {
      console.log("🔄 Token expired - attempting refresh...");

      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        // שלח את הבקשה שוב עם ה-Token החדש
        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        // Refresh נכשל - סוגר את המודל של התחברות
        return { error: "שגיאה בהרשאה" };
      }
    }

    // בדוק אם התשובה בסדר
    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData?.message || "שגיאה לא ידועה",
        status: response.status,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Network error:", error);
    return { error: error.message };
  }
}

/**
 * 📝 דוגמה: התחברות
 */
export async function login(email, password) {
  return apiCall("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * 📝 דוגמה: קבלת נתונים מוגנים
 */
export async function getCart() {
  return apiCall("cart", { method: "GET" });
}

/**
 * 🚪 התנתקות
 */
export function logout() {
  localStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  window.location.href = "/login"; // חזור לעמוד התחברות
}

/**
 * 📝 דוגמה: רישום
 */
export async function register(name, email, password) {
  return apiCall("auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}
```

### 💻 איך משתמשים:

```javascript
// ב-Login.jsx
import { login, logout } from "./utils/api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const result = await login(email, password);

    if (result.error) {
      alert(result.error);
    } else {
      // שמור את ה-Tokens
      localStorage.setItem("accessToken", result.data.token);
      sessionStorage.setItem("refreshToken", result.data.refreshToken);
      
      // עבור לעמוד ראשי
      window.location.href = "/";
    }
  };

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>כניסה</button>
    </div>
  );
}
```

```javascript
// בכל מקום אחר (Orders.jsx, Cart.jsx וכו')
import { apiCall, logout } from "./utils/api";

function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const result = await apiCall("orders", { method: "GET" });

    if (result.error) {
      alert(result.error);
      // אם זה שגיאת הרשאה, הפונקציה כבר קראה ל-logout
    } else {
      setOrders(result.data);
    }
  };

  return (
    <div>
      <h1>ההזמנות שלי</h1>
      {/* הצג הזמנות */}
      <button onClick={logout}>התנתקות</button>
    </div>
  );
}
```

---

## 🌟 Option 2: Axios

**זה עובד אם:**
- משתמש ב-`axios` לבקשות
- משתמש `useEffect` ו-`useState`

### 📁 יצור קובץ: `src/utils/axiosInstance.js`

```javascript
import axios from "axios";

const API_BASE_URL = "http://localhost:4001/api/";

// יצור axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// דגל לעקוב אחרי refresh (כדי לא לעשות refresh מספר פעמים בו זמנית)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

/**
 * 🔄 Interceptor לבקשות (בפני בקשה נשלחת)
 */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * 🔄 Interceptor לתגובות (אחרי בקשה)
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // אם התשובה היא 401 וזה לא בקשה שכבר ניסינו לרענן
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = sessionStorage.getItem("refreshToken");

        try {
          const response = await axios.post(
            `${API_BASE_URL}auth/refresh`,
            { refreshToken },
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          const newAccessToken = response.data?.data?.token;

          if (newAccessToken) {
            localStorage.setItem("accessToken", newAccessToken);
            console.log("✅ Token רוענן בהצלחה");

            // עדכן את ה-Authorization header
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

            // שלח את כל הבקשות שהמתינו
            processQueue(null, newAccessToken);

            // שלח את הבקשה המקורית שוב
            return axiosInstance(originalRequest);
          }
        } catch (err) {
          console.error("❌ Token refresh failed");
          processQueue(err, null);

          // התנתק המשתמש
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      } else {
        // יש כבר refresh בתהליך - חכה לו
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 💻 איך משתמשים:

```javascript
// ב-Login.jsx
import axiosInstance from "./utils/axiosInstance";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const result = await axiosInstance.post("auth/login", {
        email,
        password,
      });

      // שמור את ה-Tokens
      localStorage.setItem("accessToken", result.data.data.token);
      sessionStorage.setItem("refreshToken", result.data.data.refreshToken);

      window.location.href = "/";
    } catch (error) {
      alert(error.response?.data?.message || "שגיאה בהתחברות");
    }
  };

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>כניסה</button>
    </div>
  );
}
```

```javascript
// בכל מקום אחר (Orders.jsx וכו')
import axiosInstance from "./utils/axiosInstance";

function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await axiosInstance.get("orders");
        setOrders(result.data.data);
      } catch (error) {
        console.error("❌ שגיאה בטעינה");
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h1>ההזמנות שלי</h1>
      {/* הצג הזמנות */}
    </div>
  );
}
```

---

## 🌟 Option 3: RTK Query

**זה עובד אם:**
- משתמש ב-Redux + Redux Toolkit
- משתמש ב-RTK Query

### 📁 יצור קובץ: `src/app/api.ts`

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = "http://localhost:4001/api/";

// Fetch base query עם tokens
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrapper עם auto refresh
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // 🔄 אם 401 (Token expired)
  if (result.error && result.error.status === 401) {
    console.log("🔄 Token expired - attempting refresh...");

    const refreshToken = sessionStorage.getItem("refreshToken");

    if (refreshToken) {
      try {
        const refreshResult = await fetch(
          `${API_BASE_URL}auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (refreshResult.ok) {
          const data = await refreshResult.json();
          const newAccessToken = data?.data?.token;

          if (newAccessToken) {
            // עדכן את ה-token
            localStorage.setItem("accessToken", newAccessToken);

            // שלח את הבקשה שוב
            result = await baseQuery(args, api, extraOptions);
          }
        }
      } catch (error) {
        console.error("❌ Token refresh failed");
      }
    }

    // אם refresh נכשל
    if (result.error?.status === 401) {
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
  }

  return result;
};

// יצור API
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // 🔑 Auth Endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    register: builder.mutation({
      query: (userData) => ({
        url: "auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    // 📦 Data Endpoints (דוגמאות)
    getCart: builder.query({
      query: () => "cart",
    }),

    getOrders: builder.query({
      query: () => "orders",
    }),

    addToCart: builder.mutation({
      query: (productData) => ({
        url: "cart",
        method: "POST",
        body: productData,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCartQuery,
  useGetOrdersQuery,
  useAddToCartMutation,
} = api;
```

### 💻 איך משתמשים:

```typescript
// ב-store.ts
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
```

```typescript
// ב-Login.tsx
import { useLoginMutation } from "./app/api";

function LoginPage() {
  const [login] = useLoginMutation();

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password }).unwrap();

      localStorage.setItem("accessToken", result.data.token);
      sessionStorage.setItem("refreshToken", result.data.refreshToken);

      window.location.href = "/";
    } catch (error: any) {
      alert(error?.data?.message || "שגיאה בהתחברות");
    }
  };

  return <div>{/* form */}</div>;
}
```

```typescript
// בכל מקום אחר (Orders.tsx וכו')
import { useGetOrdersQuery } from "./app/api";

function OrdersPage() {
  const { data, isLoading, error } = useGetOrdersQuery();

  if (isLoading) return <div>טוען...</div>;

  return (
    <div>
      <h1>ההזמנות שלי</h1>
      {data?.data?.map((order) => (
        <div key={order.id}>{order.name}</div>
      ))}
    </div>
  );
}
```

---

## 🎯 איך בוחרים?

| עבור חברך... | בחר |
|-------------|-----|
| **משתמש `fetch` בלי Redux** | ✅ Option 1 |
| **משתמש `axios`** | ✅ Option 2 |
| **משתמש Redux + RTK Query** | ✅ Option 3 |

---

## ✅ בדיקה - אחרי שחברך מעתיק את הקוד:

```
1. התחברות עובדת?
   └─> בדוק: localStorage.getItem("accessToken") בקונסול
   
2. Token רוענן אוטומטי?
   └─> בדוק:
       a. התחבר
       b. בקונסול: localStorage.setItem("accessToken", "invalid")
       c. נסה לטעון עמוד שדורש auth
       d. תראה בקונסול: "🔄 Token expired" ואחרי זה "✅ Token refreshed"
   
3. Logout עובד?
   └─> בדוק: localStorage/sessionStorage ריק
```

---

**זה הכל שחברך צריך! 🎉**

**גרסה: 1.0 | תאריך: 26.02.2026**
