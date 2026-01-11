# 🔗 Simple Shop API Reference

## 🏥 Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | בדיקת תקינות השרת |
| GET | `/api/health/ping` | pong |

---

## 🔐 Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | הרשמה | ❌ |
| POST | `/api/auth/login` | כניסה | ❌ |
| POST | `/api/auth/logout` | יציאה | ✅ |
| GET | `/api/auth/verify` | בדיקת טוקן | ✅ |
| GET | `/api/auth/profile` | קבלת פרופיל | ✅ |
| PUT | `/api/auth/profile` | עדכון פרופיל | ✅ |
| POST | `/api/auth/forgot-password` | בקשה לאיפוס | ❌ |
| POST | `/api/auth/reset-password/:token` | איפוס סיסמה | ❌ |

---

## 📦 Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | כל המוצרים | ❌ |
| GET | `/api/products/:id` | מוצר בודד | ❌ |
| GET | `/api/products?search=...&category=...&minPrice=...&maxPrice=...&sort=...` | חיפוש וסינון | ❌ |

---

## 👤 Addresses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/addresses` | כל הכתובות | ✅ |
| GET | `/api/addresses/default` | ברירת מחדל | ✅ |
| GET | `/api/addresses/:id` | כתובת בודדת | ✅ |
| POST | `/api/addresses` | יצירה | ✅ |
| PUT | `/api/addresses/:id` | עדכון | ✅ |
| DELETE | `/api/addresses/:id` | מחיקה | ✅ |
| POST | `/api/addresses/:id/set-default` | הגדרת default | ✅ |

---

## 🛒 Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | קבלת עגלה | ✅ |
| GET | `/api/cart/count` | ספירה | ✅ |
| POST | `/api/cart/add` | הוספה | ✅ |
| PUT | `/api/cart/update` | עדכון כמות | ✅ |
| DELETE | `/api/cart/remove` | הסרה | ✅ |
| DELETE | `/api/cart/clear` | ריקון | ✅ |

---

## 🧾 Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | יצירה | ✅ |
| GET | `/api/orders` | שלי | ✅ |
| GET | `/api/orders/:id` | פרטים | ✅ |
| GET | `/api/orders/track/:id` | עקיבה (ציבורי) | ❌ |
| POST | `/api/orders/:id/cancel` | ביטול | ✅ |

---

## 🛠️ Admin (דורש role: admin)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/products?includeInactive=true` | רשימה | ✅ Admin |
| POST | `/api/admin/products` | יצירה | ✅ Admin |
| PUT | `/api/admin/products/:id` | עדכון | ✅ Admin |
| DELETE | `/api/admin/products/:id` | מחיקה (soft) | ✅ Admin |
| GET | `/api/admin/users?page=1&limit=20` | רשימת משתמשים | ✅ Admin |
| PUT | `/api/admin/users/:id/role` | עדכון role | ✅ Admin |
| GET | `/api/admin/orders?status=pending` | הזמנות | ✅ Admin |
| PUT | `/api/admin/orders/:id/status` | עדכון סטטוס | ✅ Admin |
| GET | `/api/admin/stats/summary` | סטטיסטיקות | ✅ Admin |

---

## 📝 Request/Response Format

### Headers
```
Content-Type: application/json
Authorization: Bearer {authToken}  (כשנדרש)
```

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔑 Variables
- `{{baseUrl}}` = http://localhost:4001
- `{{authToken}}` = JWT token
- `{{userId}}` = user ID
- `{{productId}}` = product ID
- `{{orderId}}` = order ID
- `{{addressId}}` = address ID
- `{{resetToken}}` = password reset token

---

## ✅ Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Admin only)
- `404` - Not Found
- `500` - Server Error

---

## 🚀 Quick Flow

1. **Register/Login** → קבל `authToken`
2. **Get Products** → בחר מוצר
3. **Add to Cart** → הוסף לעגלה
4. **Create Order** → צור הזמנה
5. **Track Order** → עקוב אחרי הזמנה
