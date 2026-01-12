# 🏢 Admin Panel - Quick Start Guide

## 📍 Access Admin Panel

1. **Log in as Admin User**
   - Navigate to home page
   - Click "הירשם" (Register) or "התחבר" (Login)
   - Use Postman to set admin role (see below)

2. **Enter Admin Dashboard**
   - Once logged in as admin, click on user avatar in navbar
   - Select "🏢 מרכז ניהול" from dropdown
   - You'll be redirected to `/admin/stats`

---

## 🛠️ Making a User an Admin (Postman)

```
PUT {{baseUrl}}/api/admin/users/:userId/role

Body:
{
  "role": "admin"
}
```

**Steps:**
1. Create a user via Register endpoint
2. Get the user's `userId` from login response
3. Copy the `userId` to `adminUserId` variable
4. Run this endpoint with the token of an existing admin
5. User is now admin!

---

## 📊 Admin Dashboard Pages

### 1. **סטטיסטיקה (Stats)** - `/admin/stats`
**5 Summary Cards:**
- 💰 Total Sales (₪)
- 🧾 Total Orders (count)
- ⏳ Pending Orders (count)
- 📦 Low Stock Products (count)
- 👥 Total Users (count)

**Quick Actions:**
- ➕ Add new product
- 📦 Manage orders
- ⚠️ Low stock products
- 👥 Manage users

### 2. **📦 מוצרים (Products)** - `/admin/products`

**List View:**
- Search/filter active/inactive
- See: Name, Category, Price, Stock, Status
- Product images in table

**Actions:**
- ➕ **Create** - Add new product (opens form)
- ✏️ **Edit** - Modify existing product
- 🗑️ **Delete** - Soft delete (mark inactive)

**Form Fields:**
```
- SKU (required)
- שם (required)
- תיאור (optional)
- קטגוריה (dropdown)
- מחיר (required, ₪)
- מלאי (required)
- URL תמונה (optional)
- ⭐ מוצר מיוחד (checkbox)
- 🟢 פעיל (checkbox)
```

### 3. **🧾 הזמנות (Orders)** - `/admin/orders`

**Status Filter:**
- 🔄 הכל (All orders)
- ⏳ ממתין (Pending)
- 🔄 בעיבוד (Processing)
- 🚚 שוגר (Shipped)
- ✅ הושלם (Delivered)
- ❌ בוטל (Cancelled)

**List View:**
- Order #, Customer, Total (₪), Item count, Status, Date

**Actions:**
- 📝 **Update Status** - Change order status + add tracking message

### 4. **👥 משתמשים (Users)** - `/admin/users`

**List View (Paginated - 20 per page):**
- Name, Email, Role (👑 Admin / 👤 User), Join Date

**Actions:**
- 🔧 **Change Role** - Toggle between user/admin

**Pagination:**
- ⬅️ Previous / Next ➡️
- Current page indicator

---

## 🎯 Common Tasks

### ✅ Create a Product
1. Go to `/admin/products`
2. Click "➕ מוצר חדש"
3. Fill form:
   - SKU: `PROD-001`
   - שם: `iPhone 15`
   - קטגוריה: `electronics`
   - מחיר: `4999`
   - מלאי: `50`
   - URL תמונה: paste image URL
4. Click "💾 שמור"
5. ✅ Success toast appears

### ✅ Update Order Status
1. Go to `/admin/orders`
2. Click "📝 עדכן סטטוס" on order row
3. Select new status (e.g., 🚚 שוגר)
4. Optional: Add message (e.g., "Shipped via DHL")
5. Click "💾 עדכן"
6. ✅ Order updated + tracking added

### ✅ Make User an Admin
1. Go to `/admin/users`
2. Find user in list
3. Click "🔧 שנה תפקיד"
4. Select "👑 מנהל"
5. Click "💾 שמור"
6. ✅ User is now admin

### ✅ Delete Product (Soft Delete)
1. Go to `/admin/products`
2. Click "🗑️ מחק" on product
3. Confirm in modal
4. ✅ Product marked inactive (can restore by editing)

---

## 🔍 Debug/Troubleshoot

### Admin menu not appearing?
- ✅ Check user has `role: "admin"` in database
- ✅ Log out and log back in
- ✅ Check browser console for errors

### Can't access /admin routes?
- ✅ Make sure you're logged in as admin
- ✅ Check LocalStorage for `token`
- ✅ Try refreshing page

### Tables showing "אין..."?
- ✅ Data might not exist yet
- ✅ Check API responses in DevTools Network tab
- ✅ Try creating test data first

### Mutations not working?
- ✅ Check API is running on port 4001
- ✅ Check token in Authorization header
- ✅ Look for error toast notification
- ✅ Check server logs for API errors

---

## 📡 API Endpoints

All require authentication + admin role:

```
// Products
GET    /api/admin/products?includeInactive=true
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id

// Users
GET    /api/admin/users?page=1&limit=20
PUT    /api/admin/users/:id/role

// Orders
GET    /api/admin/orders?status=pending
PUT    /api/admin/orders/:id/status

// Stats
GET    /api/admin/stats/summary
```

---

## 🎨 Features

✅ **Role-based access** - Only admins see /admin
✅ **Responsive design** - Works on mobile/tablet/desktop
✅ **Real-time updates** - RTK Query invalidation
✅ **Loading states** - Skeleton loaders + spinners
✅ **Error handling** - Toast notifications
✅ **Hebrew RTL** - Full RTL support
✅ **Emoji UI** - User-friendly icons
✅ **Confirmation modals** - Prevent accidental deletes

---

## 🚀 Next Session

To continue:
1. Test all admin features
2. Report any issues
3. Consider UI/UX improvements
4. Add more endpoints as needed
5. Integrate with webhooks
6. Add email notifications

---

**Created:** January 12, 2026
**Admin Panel:** ✅ COMPLETE
