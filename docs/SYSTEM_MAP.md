# 🗺️ Simple Shop - מפת המערכת החזותית המלאה

> **🎯 מדריך ויזואלי מלא למערכת Simple Shop - כל הזרימות, ההחלטות, ואינטראקציות בתרשימים אינטראקטיביים**

---

## 🚀 התחל כאן - Quick Start Guide

### 👨‍💻 למתכנתים:
- 🏗️ התחל בـ **System Architecture** - הבן את הרמות
- 🔐 עבור להـ **Authentication Flow** - איך משתמשים מחוברים
- 🛒 עבור להـ **Cart Flow** - איך העגלה עובדת
- ❌ סיים בـ **Error Handling** - איך טועלים בבעיות

### 🎨 לעצמאים UI/UX:
- 👤 התחל בـ **Component Lifecycle** - איך הקומפוננטות עובדות
- 🎭 עבור להـ **State Management** - איך Redux שומר את הנתונים
- 🔄 עבור להـ **Cart Merge Flow** - למה זה חשוב

### 🧪 ל-QA/Testers:
- 🔐 בדוק את **Authentication Flow** - כל ה-edge cases
- 🛒 בדוק את **Cart Flow** - כמויות, מלאי, guest/user
- 📦 בדוק את **Orders System** - יצירה, ביטול, statuses

---

## 📋 Table of Contents
- [🗺️ Simple Shop - מפת המערכת החזותית המלאה](#️-simple-shop---מפת-המערכת-החזותית-המלאה)
  - [🚀 התחל כאן - Quick Start Guide](#-התחל-כאן---quick-start-guide)
    - [👨‍💻 למתכנתים:](#-למתכנתים)
    - [🎨 לעצמאים UI/UX:](#-לעצמאים-uiux)
    - [🧪 ל-QA/Testers:](#-ל-qatesters)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎨 מקרא צבעים וסימנים](#-מקרא-צבעים-וסימנים)
    - [תרשים Architecture:](#תרשים-architecture)
    - [תרשימי Flow:](#תרשימי-flow)
  - [🏗️ System Architecture](#️-system-architecture)
  - [🔐 Authentication Flow with Conditions](#-authentication-flow-with-conditions)
  - [🛒 Cart Flow with Multiple Conditions](#-cart-flow-with-multiple-conditions)
  - [📦 Orders System Flow](#-orders-system-flow)
  - [👤 Profile Management Flow](#-profile-management-flow)
  - [🔄 Cart Merge Flow (Login/Register)](#-cart-merge-flow-loginregister)
  - [🎭 State Management Flow with Redux](#-state-management-flow-with-redux)
  - [🔄 Complete Component Lifecycle with Conditions](#-complete-component-lifecycle-with-conditions)
  - [❌ Error Handling Flow Map](#-error-handling-flow-map)
  - [🗄️ Database Relationships (ERD)](#️-database-relationships-erd)
  - [🔒 Security \& Middleware Flow](#-security--middleware-flow)
  - [🔍 Search \& Filter Flow](#-search--filter-flow)
  - [📧 Notification \& Email Flow](#-notification--email-flow)
  - [👨‍💼 Admin Dashboard Flow (Future)](#-admin-dashboard-flow-future)
  - [💳 Payment Flow (Future Integration)](#-payment-flow-future-integration)
  - [🔄 Token Refresh \& Session Management](#-token-refresh--session-management)
  - [🎯 Summary \& How to Use This Document](#-summary--how-to-use-this-document)
    - [📚 למה קובץ זה שימושי:](#-למה-קובץ-זה-שימושי)
    - [🎯 איך להשתמש:](#-איך-להשתמש)
    - [🔧 איך עוديים אלו:](#-איך-עוديים-אלו)
  - [💡 Best Practices לקריאת Diagrams](#-best-practices-לקריאת-diagrams)

---

## 🎨 מקרא צבעים וסימנים

### תרשים Architecture:
| צבע | משמעות | דוגמה |
|-----|--------|-------|
| 🔵 **כחול** | Frontend & UI | NavBar, Redux Store |
| 🟢 **ירוק** | Backend & Services | Controllers, Services |
| 🟠 **כתום** | Database & Cache | MongoDB, Redis |
| 🔵 **רוז** | Communication | HTTP/JSON API |

### תרשימי Flow:
| צבע | משמעות | דוגמה |
|-----|--------|-------|
| 🟢 **ירוק** | Success/Valid | ✅ Allow access, ✅ Valid data |
| 🔴 **אדום** | Error/Invalid | ❌ Access denied, ❌ Invalid input |
| 🟡 **צהוב** | Warning/Caution | ⚠️ Low stock, ⚠️ Confirmation |
| 🔵 **כחול** | Process/Action | 📋 Load data, 🔄 Merge carts |

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "👤 USER LAYER"
        User[🧑‍💻 User]
    end
    
    subgraph "🖥️ FRONTEND - React App"
        subgraph "📱 UI Components"
            NavBar["🧭 NavBar<br/>Auth buttons<br/>Cart icon<br/>User menu"]
            ProductList["📦 Product List<br/>Grid display<br/>Product cards"]
            AuthModal["🔐 Auth Modal<br/>Login form<br/>Register form"]
            Cart["🛒 Cart Page<br/>Item list<br/>Totals"]
        end
        
        subgraph "🧠 State Management"
            Redux[⚡ Redux Store]
            AuthSlice["🔐 authSlice<br/>user: User | null<br/>token: string<br/>isAuthenticated: boolean"]
            CartSlice["🛒 cartSlice<br/>items: CartItem[]<br/>total: number<br/>sessionId: string"]
            ApiSlice["🌐 apiSlice<br/>RTK Query<br/>Auto-caching"]
        end
    end
    
    subgraph "🔗 COMMUNICATION LAYER"
        HTTP[🌐 HTTP/JSON<br/>REST API Calls]
    end
    
    subgraph "🔙 BACKEND - Express Server"
        subgraph "🛣️ Routes Layer"
            AuthRoutes["🔐 /api/auth/*<br/>POST /login<br/>POST /register<br/>GET /verify<br/>POST /logout<br/>GET /profile<br/>PUT /profile<br/>PUT /password"]
            CartRoutes["🛒 /api/cart/*<br/>GET /<br/>POST /add<br/>PUT /update<br/>DELETE /remove<br/>POST /merge"]
            ProductRoutes["📦 /api/products/*<br/>GET /<br/>GET /:id"]
            OrderRoutes["📦 /api/orders/*<br/>POST /<br/>GET /<br/>GET /:id<br/>POST /:id/cancel<br/>PUT /:id/status"]
        end
        
        subgraph "🎯 Controllers"
            AuthController["🔐 AuthController<br/>login()<br/>register()<br/>verify()<br/>logout()<br/>getProfile()<br/>updateProfile()<br/>changePassword()"]
            CartController["🛒 CartController<br/>addToCart()<br/>getCart()<br/>updateCart()<br/>clearCart()<br/>mergeCart()"]
            ProductController["📦 ProductController<br/>getProducts()<br/>getProduct()"]
            OrderController["📦 OrderController<br/>createOrder()<br/>getOrders()<br/>getOrder()<br/>cancelOrder()<br/>updateStatus()"]
        end
        
        subgraph "⚙️ Services Layer"
            AuthService["🔐 AuthService<br/>User validation<br/>JWT generation<br/>Password hashing<br/>Profile management"]
            CartService["🛒 CartService<br/>Cart operations<br/>Guest/User merge<br/>Session handling"]
            ProductService["📦 ProductService<br/>Product queries<br/>Stock management"]
            OrderService["📦 OrderService<br/>Order creation<br/>Order tracking<br/>Status updates"]
        end
    end
    
    subgraph "🗄️ DATABASE LAYER"
        subgraph "💾 MongoDB"
            Users["👤 users<br/>_id<br/>name<br/>email<br/>passwordHash"]
            Products["📦 products<br/>_id<br/>name<br/>price<br/>stock<br/>image"]
            Carts["🛒 carts<br/>userId<br/>sessionId<br/>items[]"]
            Orders["📦 orders<br/>_id<br/>userId<br/>items[]<br/>total<br/>status<br/>createdAt"]
        end
        
        subgraph "⚡ Redis Cache"
            Sessions["🔄 sessions<br/>session:id → cart data"]
            Cache["📋 cache<br/>products cache"]
        end
    end

    %% User Interactions
    User --> NavBar
    User --> ProductList
    User --> AuthModal
    User --> Cart
    
    %% Component to State
    NavBar --> AuthSlice
    NavBar --> CartSlice
    ProductList --> ApiSlice
    AuthModal --> AuthSlice
    Cart --> CartSlice
    
    %% State Management
    AuthSlice --> Redux
    CartSlice --> Redux
    ApiSlice --> Redux
    
    %% Frontend to Backend
    Redux --> HTTP
    HTTP --> AuthRoutes
    HTTP --> CartRoutes
    HTTP --> ProductRoutes
    HTTP --> OrderRoutes
    
    %% Routes to Controllers
    AuthRoutes --> AuthController
    CartRoutes --> CartController
    ProductRoutes --> ProductController
    OrderRoutes --> OrderController
    
    %% Controllers to Services
    AuthController --> AuthService
    CartController --> CartService
    ProductController --> ProductService
    OrderController --> OrderService
    
    %% Services to Database
    AuthService --> Users
    CartService --> Carts
    CartService --> Sessions
    ProductService --> Products
    ProductService --> Cache
    OrderService --> Orders
    OrderService --> Carts

    %% Styling
    classDef userLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef backend fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef database fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef communication fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class User userLayer
    class NavBar,ProductList,AuthModal,Cart,Redux,AuthSlice,CartSlice,ApiSlice frontend
    class AuthRoutes,CartRoutes,ProductRoutes,AuthController,CartController,ProductController,AuthService,CartService,ProductService backend
    class Users,Products,Carts,Sessions,Cache database
    class HTTP communication
```

---

## 🔐 Authentication Flow with Conditions

> **מטרה:** זה מציג כיצד משתמש מזדהה, מתחבר, ומטוען לעגלה שלו או עגלת אורח

**🔑 Key Points:**
- Token expiration handling - אם Token פג תוקף, refresh מיד
- Guest cart merge - כשאורח מתחבר, עגלתו מתמזגת לחשבון
- Rate limiting - 5 ניסיונות לדקה בלבד

```mermaid
flowchart TD
    Start([👤 User wants to access protected feature]) --> CheckAuth{🔐 Is user authenticated?}
    
    %% Authentication Check
    CheckAuth -->|✅ Yes| CheckToken{📋 Token valid?}
    CheckAuth -->|❌ No| ShowLoginModal[🔐 Show Login Modal]
    
    %% Token Validation
    CheckToken -->|✅ Valid| Allow[✅ Allow access]
    CheckToken -->|❌ Expired| RefreshToken{🔄 Try token refresh?}
    CheckToken -->|❌ Invalid| ClearToken[🗑️ Clear invalid token]
    
    %% Token Refresh Logic
    RefreshToken -->|✅ Success| UpdateToken[📝 Update token]
    RefreshToken -->|❌ Failed| ShowLoginModal
    UpdateToken --> Allow
    ClearToken --> ShowLoginModal
    
    %% Login Modal Flow
    ShowLoginModal --> LoginChoice{📋 User chooses?}
    LoginChoice -->|🔑 Login| LoginForm[📝 Login Form]
    LoginChoice -->|📝 Register| RegisterForm[📝 Register Form]
    LoginChoice -->|❌ Cancel| Redirect[🔄 Redirect to public page]
    
    %% Login Process
    LoginForm --> ValidateLogin{✅ Valid credentials?}
    ValidateLogin -->|✅ Yes| LoginSuccess[🎉 Login successful]
    ValidateLogin -->|❌ No| LoginError[❌ Show error message]
    LoginError --> LoginForm
    
    %% Register Process
    RegisterForm --> ValidateRegister{✅ Valid registration?}
    ValidateRegister -->|✅ Yes| RegisterSuccess[🎉 Registration successful]
    ValidateRegister -->|❌ Email exists| EmailError[❌ Email already exists]
    ValidateRegister -->|❌ Weak password| PasswordError[❌ Password too weak]
    EmailError --> RegisterForm
    PasswordError --> RegisterForm
    
    %% Success Flows
    LoginSuccess --> MergeCart{🛒 Has guest cart?}
    RegisterSuccess --> MergeCart
    
    MergeCart -->|✅ Yes| MergeCarts[🔄 Merge guest + user carts]
    MergeCart -->|❌ No| LoadUserCart[📋 Load user cart]
    
    MergeCarts --> UpdateUI[🖥️ Update entire UI]
    LoadUserCart --> UpdateUI
    UpdateUI --> Allow

    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class Start start
    class CheckAuth,CheckToken,RefreshToken,LoginChoice,ValidateLogin,ValidateRegister,MergeCart decision
    class ShowLoginModal,LoginForm,RegisterForm,ClearToken,UpdateToken,MergeCarts,LoadUserCart,UpdateUI process
    class Allow,LoginSuccess,RegisterSuccess,UpdateUI success
    class LoginError,EmailError,PasswordError error
```

---

## 🛒 Cart Flow with Multiple Conditions

> **מטרה:** מציג את כל הגדלים שחייבים לבדוק כשמוסיפים מוצר לעגלה

**🔑 Key Points:**
- Guest carts stored in Redis (מהיר, זמני 24h)
- User carts stored in MongoDB (קבוע, זוכר תמיד)
- Guest dedup - אם פריט כבר בעגלת אורח, רק מעדכנים כמות (לא מוסיפים כפול)
- Stock validation - אם אין מספיק, מראים שגיאה
- Quantity limits - לא יכול לקנות יותר מ-X

```mermaid
flowchart TD
    UserAction([👤 User clicks Add to Cart]) --> CheckProduct{📦 Product exists?}
    
    %% Product Validation
    CheckProduct -->|❌ No| ProductError[❌ Product not found]
    CheckProduct -->|✅ Yes| CheckStock{📊 Check stock}
    
    %% Stock Validation
    CheckStock -->|❌ Out of stock| StockError[❌ Out of stock error]
    CheckStock -->|⚠️ Low stock| LowStockWarning[⚠️ Show low stock warning]
    CheckStock -->|✅ Available| CheckQuantity{🔢 Valid quantity?}
    
    LowStockWarning --> CheckQuantity
    
    %% Quantity Validation
    CheckQuantity -->|❌ Invalid| QuantityError[❌ Invalid quantity]
    CheckQuantity -->|✅ Valid| CheckUser{👤 User type?}
    
    %% User Type Check
    CheckUser -->|🔐 Logged in| LoggedInFlow[📋 Process as logged-in user]
    CheckUser -->|👤 Guest| GuestFlow[📋 Process as guest]
    
    %% Guest Flow
    GuestFlow --> CheckGuestSession{🔄 Has guest session?}
    CheckGuestSession -->|❌ No| CreateGuestSession[🆕 Create guest session]
    CheckGuestSession -->|✅ Yes| UseExistingSession[📋 Use existing session]

    CreateGuestSession --> CheckGuestExistingItem{🔍 Item already in guest cart?}
    UseExistingSession --> CheckGuestExistingItem

    CheckGuestExistingItem -->|✅ Yes| UpdateGuestQuantity[🔄 Update guest quantity]
    CheckGuestExistingItem -->|❌ No| AddToGuestCart[🛒 Add to guest cart]
    
    %% Logged-in Flow
    LoggedInFlow --> CheckUserCart{🛒 Has existing cart?}
    CheckUserCart -->|❌ No| CreateUserCart[🆕 Create user cart]
    CheckUserCart -->|✅ Yes| CheckExistingItem{🔍 Item already in cart?}
    
    CreateUserCart --> AddNewItem[➕ Add new item]
    
    CheckExistingItem -->|❌ No| AddNewItem
    CheckExistingItem -->|✅ Yes| UpdateQuantity[🔄 Update quantity]
    
    %% Cart Operations
    AddToGuestCart --> SaveToRedis[(⚡ Save to Redis)]
    UpdateGuestQuantity --> SaveToRedis
    AddNewItem --> SaveToMongoDB[(💾 Save to MongoDB)]
    UpdateQuantity --> SaveToMongoDB
    
    SaveToRedis --> UpdateUI[🖥️ Update UI]
    SaveToMongoDB --> UpdateRedisCache[(⚡ Update Redis cache)]
    UpdateRedisCache --> UpdateUI
    
    %% UI Updates with conditions
    UpdateUI --> CheckCartCount{🔢 Cart count?}
    CheckCartCount -->|0| HideCartBadge[👻 Hide cart badge]
    CheckCartCount -->|1-9| ShowSimpleBadge[🔵 Show number badge]
    CheckCartCount -->|10+| ShowPlusBadge[🔴 Show 9+ badge]
    
    %% Success end states
    HideCartBadge --> Success[✅ Operation complete]
    ShowSimpleBadge --> Success
    ShowPlusBadge --> Success
    
    %% Error end states
    ProductError --> ErrorEnd[❌ Operation failed]
    StockError --> ErrorEnd
    QuantityError --> ErrorEnd

    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef warning fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class UserAction start
    class CheckProduct,CheckStock,CheckQuantity,CheckUser,CheckGuestSession,CheckGuestExistingItem,CheckUserCart,CheckExistingItem,CheckCartCount decision
    class ProductError,StockError,QuantityError,ErrorEnd error
    class LowStockWarning warning
    class LoggedInFlow,GuestFlow,CreateGuestSession,UseExistingSession,UpdateGuestQuantity,CreateUserCart,AddNewItem,UpdateQuantity,AddToGuestCart,UpdateUI,HideCartBadge,ShowSimpleBadge,ShowPlusBadge process
    class SaveToRedis,SaveToMongoDB,UpdateRedisCache database
    class Success success
```

---

## 📦 Orders System Flow

> **מטרה:** הזרימה המלאה מיצירת הזמנה, ביטול, וגם עדכון סטטוס

**🔑 Key Points:**
- Order status: pending → processing → shipped → delivered
- Stock update - מיד אחרי יצירת הזמנה, המלאי יורד
- Cart clearing - עגלה נמחקה אחרי יצירה מוצלחת
- Order cancellation - רק אם pending, לא shipped/delivered

```mermaid
flowchart TD
    CreateOrder([👤 User clicks Create Order]) --> CheckAuth{🔐 User authenticated?}
    
    %% Authentication Check
    CheckAuth -->|❌ No| RedirectLogin[🔑 Redirect to login]
    CheckAuth -->|✅ Yes| CheckCart{🛒 Cart has items?}
    
    %% Cart Validation
    CheckCart -->|❌ Empty| EmptyCartError[❌ Cart is empty error]
    CheckCart -->|✅ Has items| ValidateStock{📊 Validate all items stock}
    
    %% Stock Validation
    ValidateStock -->|❌ Out of stock| StockError[❌ Some items out of stock]
    ValidateStock -->|✅ All available| CalculateTotal[💰 Calculate order total]
    
    %% Order Creation
    CalculateTotal --> CreateOrderDoc[📝 Create order document]
    CreateOrderDoc --> SaveToMongoDB[(💾 Save order to MongoDB)]
    SaveToMongoDB --> OrderSaved{📋 Order saved?}
    
    OrderSaved -->|❌ Failed| OrderError[❌ Order creation failed]
    OrderSaved -->|✅ Success| ClearUserCart[🗑️ Clear user cart]
    
    ClearUserCart --> DeleteFromMongoDB[(💾 Delete cart from MongoDB)]
    DeleteFromMongoDB --> DeleteFromRedis[(⚡ Delete cart from Redis)]
    DeleteFromRedis --> UpdateOrderUI[🖥️ Update UI with order]
    
    UpdateOrderUI --> ShowOrderConfirmation[✅ Show order confirmation]
    ShowOrderConfirmation --> OrderSuccess[🎉 Order created successfully]
    
    %% View Orders
    ViewOrders([👤 User views orders]) --> GetUserOrders[📋 Fetch user orders]
    GetUserOrders --> QueryMongoDB[(💾 Query MongoDB)]
    QueryMongoDB --> DisplayOrders[📱 Display orders list]
    
    %% Order Details
    DisplayOrders --> UserSelectsOrder{👆 User clicks order?}
    UserSelectsOrder -->|✅ Yes| ShowOrderDetails[📋 Show order details]
    UserSelectsOrder -->|❌ No| DisplayOrders
    
    %% Cancel Order
    ShowOrderDetails --> UserAction{👆 User action?}
    UserAction -->|❌ Cancel order| CheckOrderStatus{📊 Order status?}
    UserAction -->|📋 View details| ShowOrderDetails
    UserAction -->|🔙 Back| DisplayOrders
    
    CheckOrderStatus -->|📦 Pending| AllowCancel[✅ Allow cancellation]
    CheckOrderStatus -->|🚚 Shipped/Delivered| DenyCancel[❌ Cannot cancel]
    
    AllowCancel --> UpdateOrderStatus[📝 Update status to Cancelled]
    UpdateOrderStatus --> SaveCancellation[(💾 Save to MongoDB)]
    SaveCancellation --> ShowCancelConfirmation[✅ Show cancellation confirmation]
    
    DenyCancel --> ShowCannotCancelError[❌ Order cannot be cancelled]

    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class CreateOrder,ViewOrders start
    class CheckAuth,CheckCart,ValidateStock,OrderSaved,UserSelectsOrder,UserAction,CheckOrderStatus decision
    class RedirectLogin,CalculateTotal,CreateOrderDoc,ClearUserCart,UpdateOrderUI,ShowOrderConfirmation,GetUserOrders,DisplayOrders,ShowOrderDetails,AllowCancel,DenyCancel,UpdateOrderStatus,ShowCancelConfirmation process
    class EmptyCartError,StockError,OrderError,ShowCannotCancelError error
    class OrderSuccess,ShowOrderConfirmation,ShowCancelConfirmation success
    class SaveToMongoDB,DeleteFromMongoDB,DeleteFromRedis,QueryMongoDB,SaveCancellation database
```

---

## 👤 Profile Management Flow

> **מטרה:** משתמש יכול לעדכן פרטים, לשנות סיסמה, למחוק חשבון

**🔑 Key Points:**
- Profile updates - שם, email, תמונה פרופיל
- Password change - מחייב סיסמה הנוכחית כדי לשנות
- Account deletion - יכול לשחזור תוך 30 יום
- Logout all sessions - אחרי שינוי סיסמה

```mermaid
flowchart TD
    ProfileAccess([👤 User accesses profile]) --> CheckAuth{🔐 User authenticated?}
    
    %% Authentication Check
    CheckAuth -->|❌ No| RedirectLogin[🔑 Redirect to login]
    CheckAuth -->|✅ Yes| LoadProfile[📋 Load user profile]
    
    LoadProfile --> QueryUserData[(💾 Query user from MongoDB)]
    QueryUserData --> DisplayProfile[📱 Display profile page]
    
    %% Profile Actions
    DisplayProfile --> UserAction{👆 User selects action?}
    
    UserAction -->|✏️ Edit Profile| EditProfile[📝 Show edit form]
    UserAction -->|🔑 Change Password| ChangePassword[🔐 Show password form]
    UserAction -->|📊 View Stats| ViewStats[📊 Show user statistics]
    UserAction -->|🗑️ Delete Account| ConfirmDelete[⚠️ Show delete confirmation]
    UserAction -->|🔙 Back| Dashboard[🏠 Back to dashboard]
    
    %% Edit Profile Flow
    EditProfile --> EditForm{📋 User submits?}
    EditForm -->|❌ Cancel| DisplayProfile
    EditForm -->|✅ Submit| ValidateProfile{✅ Validate changes?}
    
    ValidateProfile -->|❌ Invalid| ShowProfileErrors[❌ Show validation errors]
    ValidateProfile -->|✅ Valid| UpdateProfile[(💾 Update MongoDB)]
    
    ShowProfileErrors --> EditProfile
    UpdateProfile --> RefreshProfile[🔄 Refresh profile data]
    RefreshProfile --> ShowProfileSuccess[✅ Profile updated successfully]
    ShowProfileSuccess --> DisplayProfile
    
    %% Change Password Flow
    ChangePassword --> PasswordForm{📋 User submits?}
    PasswordForm -->|❌ Cancel| DisplayProfile
    PasswordForm -->|✅ Submit| ValidatePassword{✅ Validate password?}
    
    ValidatePassword -->|❌ Current wrong| ShowPasswordError[❌ Current password incorrect]
    ValidatePassword -->|❌ Weak new| ShowWeakPassword[❌ New password too weak]
    ValidatePassword -->|✅ Valid| HashPassword[🔐 Hash new password]
    
    ShowPasswordError --> ChangePassword
    ShowWeakPassword --> ChangePassword
    
    HashPassword --> UpdatePassword[(💾 Update password in MongoDB)]
    UpdatePassword --> LogoutAllSessions[🚪 Logout all sessions]
    LogoutAllSessions --> ShowPasswordSuccess[✅ Password changed successfully]
    ShowPasswordSuccess --> RedirectLogin
    
    %% View Stats Flow
    ViewStats --> QueryStats[(💾 Query user statistics)]
    QueryStats --> CalculateStats[📊 Calculate statistics]
    CalculateStats --> DisplayStats[📱 Display stats page]
    DisplayStats --> UserAction
    
    %% Delete Account Flow
    ConfirmDelete --> UserConfirms{⚠️ User confirms deletion?}
    UserConfirms -->|❌ Cancel| DisplayProfile
    UserConfirms -->|✅ Confirm| DeactivateAccount[(💾 Deactivate account in MongoDB)]
    
    DeactivateAccount --> ClearUserData[🗑️ Clear sensitive data]
    ClearUserData --> LogoutUser[🚪 Logout user]
    LogoutUser --> ShowDeleteSuccess[✅ Account deleted successfully]
    ShowDeleteSuccess --> RedirectHome[🏠 Redirect to home page]

    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef warning fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class ProfileAccess start
    class CheckAuth,UserAction,EditForm,ValidateProfile,PasswordForm,ValidatePassword,UserConfirms decision
    class RedirectLogin,LoadProfile,DisplayProfile,EditProfile,ChangePassword,ViewStats,Dashboard,RefreshProfile,HashPassword,LogoutAllSessions,CalculateStats,DisplayStats,DeactivateAccount,ClearUserData,LogoutUser,RedirectHome process
    class ShowProfileErrors,ShowPasswordError,ShowWeakPassword error
    class ShowProfileSuccess,ShowPasswordSuccess,ShowDeleteSuccess success
    class ConfirmDelete warning
    class QueryUserData,UpdateProfile,UpdatePassword,QueryStats,DeactivateAccount database
```

---

## 🔄 Cart Merge Flow (Login/Register)

> **מטרה:** כשאורח מתחבר/רושם חשבון, אנו מומזגים את העגלה שלו לחשבון החדש

**🔑 Key Points:**
- Guest cart stored in Redis with sessionId
- When merge: לוקחים כל מוצר מעגלת ההארח
- If item exists: מוסיפים את הכמויות (לא מחליפים)
- Guest session deleted after merge

```mermaid
flowchart TD
    UserLogsIn([👤 User logs in/registers]) --> CheckGuestCart{🛒 Has guest cart?}
    
    %% Guest Cart Check
    CheckGuestCart -->|❌ No| LoadUserCart[📋 Load existing user cart]
    CheckGuestCart -->|✅ Yes| GetGuestCart[🔍 Get guest cart from session]
    
    %% Load User Cart
    LoadUserCart --> QueryUserCart[(💾 Query user cart from MongoDB)]
    QueryUserCart --> DisplayUserCart[📱 Display user cart]
    DisplayUserCart --> MergeComplete[✅ Login complete]
    
    %% Guest Cart Handling
    GetGuestCart --> GetSessionId[🔑 Get guest session ID]
    GetSessionId --> LoadGuestItems[📦 Load guest cart items]
    LoadGuestItems --> QueryUserCartForMerge[(💾 Query user cart from MongoDB)]
    
    QueryUserCartForMerge --> UserCartExists{🛒 User has existing cart?}
    
    %% Merge Logic
    UserCartExists -->|❌ No| CreateUserCart[🆕 Create new user cart]
    UserCartExists -->|✅ Yes| MergeLogic[🔄 Merge carts logic]
    
    CreateUserCart --> CopyGuestItems[📋 Copy all guest items]
    CopyGuestItems --> SaveMergedCart
    
    %% Detailed Merge Logic
    MergeLogic --> IterateGuestItems[🔄 For each guest item]
    IterateGuestItems --> CheckItemExists{🔍 Item in user cart?}
    
    CheckItemExists -->|❌ No| AddNewItem[➕ Add item to user cart]
    CheckItemExists -->|✅ Yes| CompareQuantities[🔢 Compare quantities]
    
    AddNewItem --> NextItem{📋 More items?}
    CompareQuantities --> CombineQuantities[➕ Combine quantities]
    CombineQuantities --> NextItem
    
    NextItem -->|✅ Yes| IterateGuestItems
    NextItem -->|❌ No| SaveMergedCart
    
    %% Save Merged Result
    SaveMergedCart[(💾 Save merged cart to MongoDB)] --> UpdateRedisCache[(⚡ Update Redis cache)]
    UpdateRedisCache --> DeleteGuestSession[🗑️ Delete guest session]
    DeleteGuestSession --> UpdateUI[🖥️ Update cart UI]
    UpdateUI --> ShowMergeSuccess[✅ Carts merged successfully]
    ShowMergeSuccess --> MergeComplete

    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class UserLogsIn start
    class CheckGuestCart,UserCartExists,CheckItemExists,NextItem decision
    class LoadUserCart,DisplayUserCart,GetGuestCart,GetSessionId,LoadGuestItems,CreateUserCart,CopyGuestItems,MergeLogic,IterateGuestItems,AddNewItem,CompareQuantities,CombineQuantities,DeleteGuestSession,UpdateUI,ShowMergeSuccess process
    class MergeComplete,ShowMergeSuccess success
    class QueryUserCart,QueryUserCartForMerge,SaveMergedCart,UpdateRedisCache database
```

---

## 🎭 State Management Flow with Redux

> **מטרה:** איך Redux שומר את הstate (משתמש, עגלה, טוקן) בכל הזמן

**🔑 Key Points:**
- authSlice - משתמש, token, isAuthenticated
- cartSlice - items, total, sessionId
- apiSlice - RTK Query, auto-caching
- localStorage - token שמור שם בין-הרענוניות

```mermaid
flowchart TD
    Start([App starts]) --> CheckToken{Token in localStorage?}
    
    CheckToken -->|Yes| VerifyToken[Verify token with server]
    CheckToken -->|No| GuestMode[Guest Mode]
    
    VerifyToken --> TokenValid{Token valid?}
    TokenValid -->|Yes| AuthMode[Authenticated Mode]
    TokenValid -->|No| GuestMode
    
    GuestMode --> GuestActions{User action}
    GuestActions -->|Browse| GuestBrowse[Browse as guest]
    GuestActions -->|Add to cart| GuestCart[Add to guest cart]
    GuestActions -->|Click login| ShowLogin[Show login modal]
    GuestActions -->|Click register| ShowRegister[Show register modal]
    
    GuestBrowse --> GuestActions
    GuestCart --> GuestActions
    
    ShowLogin --> LoginForm[Enter credentials]
    LoginForm --> SubmitLogin[Submit login]
    SubmitLogin --> LoginResult{Login successful?}
    LoginResult -->|Yes| AuthMode
    LoginResult -->|No| LoginError[Show error]
    LoginError --> LoginForm
    
    ShowRegister --> RegisterForm[Enter details]
    RegisterForm --> SubmitRegister[Submit registration]
    SubmitRegister --> RegisterResult{Registration successful?}
    RegisterResult -->|Yes| AuthMode
    RegisterResult -->|No| RegisterError[Show error]
    RegisterError --> RegisterForm
    
    AuthMode --> AuthActions{User action}
    AuthActions -->|Browse| AuthBrowse[Browse as user]
    AuthActions -->|Add to cart| AuthCart[Add to user cart]
    AuthActions -->|View profile| ShowProfile[Show profile]
    AuthActions -->|Logout| DoLogout[Logout]
    
    AuthBrowse --> AuthActions
    AuthCart --> AuthActions
    ShowProfile --> AuthActions
    DoLogout --> GuestMode
    
    AuthMode -->|Token expires| GuestMode
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class Start start
    class CheckToken,TokenValid,GuestActions,LoginResult,RegisterResult,AuthActions decision
    class VerifyToken,GuestMode,GuestBrowse,GuestCart,ShowLogin,ShowRegister,LoginForm,SubmitLogin,RegisterForm,SubmitRegister,AuthMode,AuthBrowse,AuthCart,ShowProfile,DoLogout process
    class AuthMode success
    class LoginError,RegisterError error
```

---

## 🔄 Complete Component Lifecycle with Conditions

> **מטרה:** איך הקומפוננטות מטעינות, מתחדשות, וגם אינטראקציות משתנות

**🔑 Key Points:**
- App.tsx mount - בודקים token בלocationStorage
- Token verification - אם תקף, load user data
- Conditional rendering - guests vs authenticated users
- useEffect hooks - מעדכנים UI בזמן real-time

```mermaid
flowchart TD
    AppStart([App.tsx mounts]) --> LoadReduxStore[Initialize Redux Store]
    LoadReduxStore --> CheckInitialAuth{Token in localStorage?}
    
    CheckInitialAuth -->|Yes| DispatchVerify[dispatch verifyToken]
    CheckInitialAuth -->|No| GuestMode[Continue as guest]
    
    DispatchVerify --> TokenResult{Token valid?}
    TokenResult -->|Valid| SetAuthenticatedState[Set authenticated state]
    TokenResult -->|Invalid| ClearTokens[Clear tokens]
    ClearTokens --> GuestMode
    
    SetAuthenticatedState --> RenderAuthenticatedUI[Render authenticated UI]
    GuestMode --> RenderGuestUI[Render guest UI]
    
    RenderAuthenticatedUI --> ShowUserName[Show user name in NavBar]
    RenderAuthenticatedUI --> LoadUserCart[Load user cart]
    
    RenderGuestUI --> ShowLoginButtons[Show login/register buttons]
    RenderGuestUI --> LoadGuestCart[Load guest cart from session]
    
    ShowUserName --> UserInteraction{User interaction}
    ShowLoginButtons --> UserInteraction
    
    UserInteraction -->|Login| ShowLoginModal[Show login modal]
    UserInteraction -->|Register| ShowRegisterModal[Show register modal]
    UserInteraction -->|Logout| ProcessLogout[dispatch logout]
    UserInteraction -->|Add to cart| ProcessAddToCart[Add to cart flow]
    
    ShowLoginModal --> AuthResult{Auth successful?}
    ShowRegisterModal --> AuthResult
    
    AuthResult -->|Success| MergeCartsFlow[Merge guest + user carts]
    AuthResult -->|Error| ShowError[Display error message]
    
    ShowError --> UserInteraction
    MergeCartsFlow --> RenderAuthenticatedUI
    
    ProcessLogout --> ClearAllState[Clear all auth state]
    ClearAllState --> RenderGuestUI
    
    ProcessAddToCart --> UpdateCartUI[Update cart display]
    UpdateCartUI --> UserInteraction
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class AppStart start
    class CheckInitialAuth,TokenResult,UserInteraction,AuthResult decision
    class LoadReduxStore,GuestMode,DispatchVerify,SetAuthenticatedState,ClearTokens,RenderAuthenticatedUI,RenderGuestUI,ShowUserName,LoadUserCart,ShowLoginButtons,LoadGuestCart,ShowLoginModal,ShowRegisterModal,ProcessLogout,ProcessAddToCart,MergeCartsFlow,ClearAllState,UpdateCartUI process
    class RenderAuthenticatedUI,MergeCartsFlow success
    class ShowError error
```

---

## ❌ Error Handling Flow Map

> **מטרה:** איך המערכת מטפלת בשגיאות - network, auth, validation, server

**🔑 Key Points:**
- Network retry - 3 ניסיונות עם wait בין-כל אחד
- Token expired - refresh token מיד
- Validation errors - display לאיזה שדה בדיוק יש בעיה
- Server errors - 500, 503 - show maintenance mode

```mermaid
flowchart TD
    ErrorOccurs([Error occurs]) --> ErrorType{Error type?}
    
    %% Network Errors
    ErrorType -->|Network Error| NetworkErrorFlow[Network error handling]
    NetworkErrorFlow --> IsOnline{Is online?}
    IsOnline -->|Yes| RetryRequest[Retry request]
    IsOnline -->|No| ShowOfflineMode[Show offline mode]
    
    RetryRequest --> RetryCount{Retry count?}
    RetryCount -->|Less than 3| WaitAndRetry[Wait & retry]
    RetryCount -->|3 or more| ShowNetworkError[Show network error]
    
    WaitAndRetry --> NetworkErrorFlow
    
    %% Authentication Errors
    ErrorType -->|Auth Error| AuthErrorFlow[Auth error handling]
    AuthErrorFlow --> AuthErrorType{Auth error type?}
    
    AuthErrorType -->|401| HandleUnauthorized[Handle unauthorized]
    AuthErrorType -->|403| HandleForbidden[Handle forbidden]
    AuthErrorType -->|Token Expired| HandleTokenExpired[Handle expired token]
    
    HandleUnauthorized --> ClearAuthAndRedirect[Clear auth & redirect]
    HandleForbidden --> ShowAccessDenied[Show access denied]
    HandleTokenExpired --> TryRefreshToken{Try refresh?}
    
    TryRefreshToken -->|Success| UpdateToken[Update token]
    TryRefreshToken -->|Failed| ClearAuthAndRedirect
    
    %% Validation Errors
    ErrorType -->|Validation Error| ValidationErrorFlow[Validation error handling]
    ValidationErrorFlow --> ShowFieldErrors[Show field errors]
    ShowFieldErrors --> HighlightFields[Highlight error fields]
    HighlightFields --> EnableRetry[Enable retry]
    
    %% Server Errors
    ErrorType -->|Server Error| ServerErrorFlow[Server error handling]
    ServerErrorFlow --> ServerErrorCode{Error code?}
    
    ServerErrorCode -->|500| ShowGenericError[Show server error]
    ServerErrorCode -->|503| ShowMaintenanceMode[Show maintenance]
    ServerErrorCode -->|404| ShowNotFound[Show not found]
    
    %% Client Errors
    ErrorType -->|Client Error| ClientErrorFlow[Client error handling]
    ClientErrorFlow --> LogError[Log to console]
    LogError --> ShowUserFriendlyError[Show friendly message]
    
    %% Recovery Actions
    ShowOfflineMode --> WaitForConnection[Wait for connection]
    WaitForConnection --> CheckConnection{Connection restored?}
    CheckConnection -->|Yes| RetryOriginalAction[Retry action]
    CheckConnection -->|No| WaitForConnection
    
    EnableRetry --> UserRetry{User retries?}
    UserRetry -->|Yes| ValidationErrorFlow
    UserRetry -->|No| StayOnPage[Stay on page]
    
    %% Success Recovery
    RetryOriginalAction --> Success[Action successful]
    UpdateToken --> Success
    
    %% Final states
    Success --> NormalFlow[Return to normal flow]
    ShowNetworkError --> ErrorPage[Error page]
    ClearAuthAndRedirect --> LoginPage[Login page]
    ShowAccessDenied --> ErrorPage
    ShowGenericError --> ErrorPage
    ShowMaintenanceMode --> MaintenancePage[Maintenance page]
    ShowNotFound --> NotFoundPage[404 page]
    ShowUserFriendlyError --> ErrorPage
    StayOnPage --> CurrentPage[Current page]
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef warning fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class ErrorOccurs start
    class ErrorType,IsOnline,RetryCount,AuthErrorType,ServerErrorCode,CheckConnection,UserRetry,TryRefreshToken decision
    class NetworkErrorFlow,RetryRequest,ShowOfflineMode,WaitAndRetry,AuthErrorFlow,HandleUnauthorized,HandleForbidden,HandleTokenExpired,ClearAuthAndRedirect,ShowAccessDenied,UpdateToken,ValidationErrorFlow,ShowFieldErrors,HighlightFields,EnableRetry,ServerErrorFlow,ClientErrorFlow,LogError,WaitForConnection,RetryOriginalAction,NormalFlow,ErrorPage,LoginPage,MaintenancePage,NotFoundPage,CurrentPage process
    class ShowNetworkError,ShowGenericError,ShowMaintenanceMode,ShowNotFound,ShowUserFriendlyError,StayOnPage error
    class Success,NormalFlow success
```

---

## 🗄️ Database Relationships (ERD)

> **מטרה:** איך כל הטבלאות מחובורת - Users, Products, Carts, Orders

**🔑 Key Points:**
- USER → CART (one-to-one) - כל משתמש יש רק עגלה אחת
- USER → ORDER (one-to-many) - משתמש יכול להיות הרבה הזמנות
- CART → PRODUCT (many-to-many via CART_ITEM)
- ORDER → PRODUCT (many-to-many via ORDER_ITEM)

```mermaid
erDiagram
    USER ||--o| CART : "has"
    USER ||--o{ ORDER : "places"
    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        date createdAt
        date updatedAt
        boolean isActive
    }
    
    CART ||--|{ CART_ITEM : "contains"
    CART {
        ObjectId _id PK
        ObjectId userId FK
        string sessionId
        date createdAt
        date updatedAt
    }
    
    CART_ITEM }o--|| PRODUCT : "references"
    CART_ITEM {
        ObjectId productId FK
        int quantity
        number price
    }
    
    PRODUCT {
        ObjectId _id PK
        string name
        string description
        number price
        int stock
        string imageUrl
        string category
        date createdAt
    }
    
    ORDER ||--|{ ORDER_ITEM : "contains"
    ORDER {
        ObjectId _id PK
        ObjectId userId FK
        string status
        number totalAmount
        object shippingAddress
        date createdAt
        date updatedAt
    }
    
    ORDER_ITEM }o--|| PRODUCT : "references"
    ORDER_ITEM {
        ObjectId productId FK
        string productName
        number price
        int quantity
        number subtotal
    }
```

---

## 🔒 Security & Middleware Flow

> **מטרה:** כל בקשה עברה דרך סדרה של middleware לבטיחות

**🔑 Key Points:**
- Rate limiting - 100 requests/minute per IP
- CORS validation - רק origins מאושרים
- Token verification - JWT signature check
- Input validation - all fields validated before processing

```mermaid
flowchart TD
    Request([HTTP Request]) --> RateLimit{Rate limit check}
    RateLimit -->|Exceeded| Return429[Return 429 Too Many Requests]
    RateLimit -->|OK| CORS{CORS validation}
    
    CORS -->|Invalid origin| Return403[Return 403 Forbidden]
    CORS -->|Valid| ParseBody[Parse JSON body]
    
    ParseBody --> RouteMatch{Match route?}
    RouteMatch -->|No match| Return404[Return 404 Not Found]
    RouteMatch -->|Match| CheckAuthRequired{Auth required?}
    
    CheckAuthRequired -->|No| ExecuteHandler[Execute handler]
    CheckAuthRequired -->|Optional| OptionalAuth[optionalAuth middleware]
    CheckAuthRequired -->|Required| RequireAuth[requireAuth middleware]
    
    OptionalAuth --> CheckToken{Token present?}
    CheckToken -->|No| ContinueAsGuest[Continue as guest]
    CheckToken -->|Yes| VerifyToken[Verify JWT]
    
    VerifyToken --> TokenValid{Token valid?}
    TokenValid -->|Yes| AttachUser[Attach user to request]
    TokenValid -->|No| ContinueAsGuest
    
    RequireAuth --> MustHaveToken{Token present?}
    MustHaveToken -->|No| Return401[Return 401 Unauthorized]
    MustHaveToken -->|Yes| VerifyRequired[Verify JWT]
    
    VerifyRequired --> RequiredValid{Token valid?}
    RequiredValid -->|No| Return401
    RequiredValid -->|Yes| AttachUser
    
    ContinueAsGuest --> ExecuteHandler
    AttachUser --> ValidateInput{Input validation}
    
    ValidateInput -->|Invalid| Return400[Return 400 Bad Request]
    ValidateInput -->|Valid| ExecuteHandler
    
    ExecuteHandler --> HandlerError{Handler throws error?}
    HandlerError -->|Yes| ErrorMiddleware[Error middleware]
    HandlerError -->|No| SendResponse[Send response]
    
    ErrorMiddleware --> LogError[Log error]
    LogError --> DetermineStatus{Determine status code}
    DetermineStatus --> SendErrorResponse[Send error response]
    
    SendResponse --> End([Response sent])
    SendErrorResponse --> End
    Return429 --> End
    Return403 --> End
    Return404 --> End
    Return401 --> End
    Return400 --> End
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class Request start
    class RateLimit,CORS,RouteMatch,CheckAuthRequired,CheckToken,TokenValid,MustHaveToken,RequiredValid,ValidateInput,HandlerError,DetermineStatus decision
    class ParseBody,OptionalAuth,RequireAuth,VerifyToken,AttachUser,ContinueAsGuest,VerifyRequired,ExecuteHandler,ErrorMiddleware,LogError,SendErrorResponse,SendResponse process
    class SendResponse,End success
    class Return429,Return403,Return404,Return401,Return400 error
```

---

## 🔍 Search & Filter Flow

> **מטרה:** משתמש מחפש ומסנן מוצרים - search text, category, price range, sort

**🔑 Key Points:**
- Text search - MongoDB text index on name/description
- Category filter - exact match on category field
- Price range - min/max filter on price
- Sort options - price asc/desc, name, newest

```mermaid
flowchart TD
    UserBrowse([User on products page]) --> SearchOrFilter{User action}
    
    SearchOrFilter -->|Type in search| SearchInput[Enter search query]
    SearchOrFilter -->|Select category| CategoryFilter[Select category]
    SearchOrFilter -->|Adjust price| PriceRange[Set min/max price]
    SearchOrFilter -->|Change sort| SortOption[Select sort order]
    
    SearchInput --> BuildQuery[Build search query]
    CategoryFilter --> BuildQuery
    PriceRange --> BuildQuery
    SortOption --> BuildQuery
    
    BuildQuery --> SendRequest[Send GET /api/products with params]
    SendRequest --> ServerReceive[Server receives request]
    
    ServerReceive --> ParseParams[Parse query parameters]
    ParseParams --> BuildMongoQuery[Build MongoDB query]
    
    BuildMongoQuery --> ApplySearch{Has search term?}
    ApplySearch -->|Yes| TextSearch[Apply text search on name/description]
    ApplySearch -->|No| ApplyCategory
    
    TextSearch --> ApplyCategory{Has category?}
    ApplyCategory -->|Yes| FilterCategory[Filter by category]
    ApplyCategory -->|No| ApplyPrice
    
    FilterCategory --> ApplyPrice{Has price range?}
    ApplyPrice -->|Yes| FilterPrice[Filter by min/max price]
    ApplyPrice -->|No| ApplySort
    
    FilterPrice --> ApplySort{Has sort option?}
    ApplySort -->|Price low-high| SortPriceAsc[Sort by price ascending]
    ApplySort -->|Price high-low| SortPriceDesc[Sort by price descending]
    ApplySort -->|Newest| SortNewest[Sort by createdAt descending]
    ApplySort -->|Name A-Z| SortName[Sort by name ascending]
    ApplySort -->|No sort| DefaultSort[Default sort]
    
    SortPriceAsc --> ExecuteQuery[Execute MongoDB query]
    SortPriceDesc --> ExecuteQuery
    SortNewest --> ExecuteQuery
    SortName --> ExecuteQuery
    DefaultSort --> ExecuteQuery
    
    ExecuteQuery --> CheckResults{Results found?}
    CheckResults -->|Yes| ReturnProducts[Return products array]
    CheckResults -->|No| ReturnEmpty[Return empty array]
    
    ReturnProducts --> ClientReceive[Client receives response]
    ReturnEmpty --> ClientReceive
    
    ClientReceive --> UpdateUI[Update ProductList UI]
    UpdateUI --> ShowResults[Display filtered products]
    
    ShowResults --> UserBrowse
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class UserBrowse start
    class SearchOrFilter,ApplySearch,ApplyCategory,ApplyPrice,ApplySort,CheckResults decision
    class SearchInput,CategoryFilter,PriceRange,SortOption,BuildQuery,SendRequest,ServerReceive,ParseParams,BuildMongoQuery,TextSearch,FilterCategory,FilterPrice,SortPriceAsc,SortPriceDesc,SortNewest,SortName,DefaultSort,ReturnProducts,ReturnEmpty,ClientReceive,UpdateUI,ShowResults process
    class ReturnProducts,ShowResults success
    class ExecuteQuery,BuildMongoQuery database
```

---

## 📧 Notification & Email Flow

> **מטרה:** שליחת emails לאירועים חשובים - welcome, order confirmation, shipping update

**🔑 Key Points:**
- Queue system - emails נשלחות async, לא blocking
- Retry logic - אם failed, spoon 5 minutes (max 3 attempts)
- Templates - HTML templates with dynamic data
- Dev mode - console logging instead of real SMTP

```mermaid
flowchart TD
    TriggerEvent([System Event]) --> EventType{Event type}
    
    EventType -->|New User| WelcomeEmail[Send welcome email]
    EventType -->|Order Created| OrderConfirm[Send order confirmation]
    EventType -->|Order Shipped| ShippingNotify[Send shipping notification]
    EventType -->|Password Reset| ResetEmail[Send reset link]
    EventType -->|Account Deactivated| DeactivateEmail[Send deactivation notice]
    
    WelcomeEmail --> PrepareEmail[Prepare email template]
    OrderConfirm --> PrepareEmail
    ShippingNotify --> PrepareEmail
    ResetEmail --> PrepareEmail
    DeactivateEmail --> PrepareEmail
    
    PrepareEmail --> LoadTemplate[Load email template]
    LoadTemplate --> InjectData[Inject dynamic data]
    InjectData --> BuildHTML[Build HTML email]
    
    BuildHTML --> SendViaService{Email service?}
    SendViaService -->|Development| LogToConsole[Log email to console]
    SendViaService -->|Production| SendSMTP[Send via SMTP/SendGrid]
    
    LogToConsole --> EmailSent[Email handled]
    SendSMTP --> CheckSendStatus{Send successful?}
    
    CheckSendStatus -->|Yes| EmailSent
    CheckSendStatus -->|No| LogFailure[Log send failure]
    LogFailure --> RetryQueue[Add to retry queue]
    
    RetryQueue --> RetryLater{Retry attempts < 3?}
    RetryLater -->|Yes| WaitAndRetry[Wait 5 minutes]
    RetryLater -->|No| MarkFailed[Mark as permanently failed]
    
    WaitAndRetry --> SendSMTP
    MarkFailed --> NotifyAdmin[Notify admin of failure]
    
    EmailSent --> End([Complete])
    NotifyAdmin --> End
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class TriggerEvent start
    class EventType,SendViaService,CheckSendStatus,RetryLater decision
    class WelcomeEmail,OrderConfirm,ShippingNotify,ResetEmail,DeactivateEmail,PrepareEmail,LoadTemplate,InjectData,BuildHTML,LogToConsole,SendSMTP,LogFailure,RetryQueue,WaitAndRetry,NotifyAdmin process
    class EmailSent,End success
    class MarkFailed error
```

---

## 👨‍💼 Admin Dashboard Flow (Future)

> **מטרה:** Admin יכול לנהל מוצרים, הזמנות, משתמשים

**🔑 Key Points:**
- Role check - רק admins יכולים להיכנס
- CRUD operations - Create, Read, Update, Delete מוצרים
- Order management - update status, view details
- User management - view stats, manage accounts

```mermaid
flowchart TD
    AdminLogin([Admin logs in]) --> CheckRole{Is admin?}
    CheckRole -->|No| DenyAccess[403 Forbidden]
    CheckRole -->|Yes| ShowDashboard[Show admin dashboard]
    
    ShowDashboard --> AdminAction{Admin action}
    
    AdminAction -->|View products| ListProducts[GET /api/admin/products]
    AdminAction -->|Add product| ShowAddForm[Show add product form]
    AdminAction -->|Edit product| ShowEditForm[Show edit product form]
    AdminAction -->|Delete product| ConfirmDelete{Confirm delete?}
    AdminAction -->|View orders| ListOrders[GET /api/admin/orders]
    AdminAction -->|Update order status| UpdateStatus[PUT /api/admin/orders/:id/status]
    AdminAction -->|View users| ListUsers[GET /api/admin/users]
    AdminAction -->|View stats| GetStats[GET /api/admin/stats]
    
    ShowAddForm --> FillDetails[Fill product details]
    FillDetails --> UploadImage{Has image?}
    UploadImage -->|Yes| UploadToCloud[Upload to cloud storage]
    UploadImage -->|No| SubmitProduct
    UploadToCloud --> SubmitProduct[POST /api/admin/products]
    
    SubmitProduct --> ValidateProduct{Valid data?}
    ValidateProduct -->|No| ShowError[Show validation errors]
    ValidateProduct -->|Yes| CreateProduct[Create product in DB]
    CreateProduct --> RefreshList[Refresh product list]
    
    ShowEditForm --> LoadProduct[Load existing product]
    LoadProduct --> ModifyDetails[Modify product details]
    ModifyDetails --> SaveChanges[PUT /api/admin/products/:id]
    SaveChanges --> ValidateUpdate{Valid data?}
    ValidateUpdate -->|No| ShowError
    ValidateUpdate -->|Yes| UpdateProduct[Update product in DB]
    UpdateProduct --> RefreshList
    
    ConfirmDelete -->|No| ShowDashboard
    ConfirmDelete -->|Yes| DeleteProduct[DELETE /api/admin/products/:id]
    DeleteProduct --> CheckInOrders{Product in active orders?}
    CheckInOrders -->|Yes| SoftDelete[Soft delete - mark inactive]
    CheckInOrders -->|No| HardDelete[Hard delete from DB]
    SoftDelete --> RefreshList
    HardDelete --> RefreshList
    
    ListOrders --> FilterOrders{Filter options}
    FilterOrders -->|By status| FilterStatus[Filter by pending/shipped/etc]
    FilterOrders -->|By date| FilterDate[Filter by date range]
    FilterOrders -->|By user| FilterUser[Filter by user]
    FilterOrders -->|All| ShowAllOrders[Show all orders]
    
    FilterStatus --> DisplayOrders[Display filtered orders]
    FilterDate --> DisplayOrders
    FilterUser --> DisplayOrders
    ShowAllOrders --> DisplayOrders
    
    UpdateStatus --> SelectStatus[Select new status]
    SelectStatus --> ConfirmUpdate{Confirm?}
    ConfirmUpdate -->|No| ShowDashboard
    ConfirmUpdate -->|Yes| UpdateOrderStatus[Update order.status]
    UpdateOrderStatus --> SendNotification[Send email to customer]
    SendNotification --> RefreshOrders[Refresh orders list]
    
    GetStats --> FetchStatistics[Fetch statistics from DB]
    FetchStatistics --> Calculate[Calculate metrics]
    Calculate --> DisplayCharts[Display charts and graphs]
    
    DisplayCharts --> ShowDashboard
    RefreshList --> ShowDashboard
    RefreshOrders --> ShowDashboard
    ShowError --> AdminAction
    DenyAccess --> End([End])
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class AdminLogin start
    class CheckRole,AdminAction,UploadImage,ValidateProduct,ValidateUpdate,ConfirmDelete,CheckInOrders,FilterOrders,ConfirmUpdate decision
    class ShowDashboard,ListProducts,ShowAddForm,ShowEditForm,ListOrders,UpdateStatus,ListUsers,GetStats,FillDetails,UploadToCloud,SubmitProduct,CreateProduct,RefreshList,LoadProduct,ModifyDetails,SaveChanges,UpdateProduct,DeleteProduct,SoftDelete,HardDelete,FilterStatus,FilterDate,FilterUser,ShowAllOrders,DisplayOrders,SelectStatus,UpdateOrderStatus,SendNotification,RefreshOrders,FetchStatistics,Calculate,DisplayCharts process
    class ShowDashboard,RefreshList,RefreshOrders success
    class DenyAccess,ShowError error
```

---

## 💳 Payment Flow (Future Integration)

> **מטרה:** משתמש משלם עם credit card או PayPal

**🔑 Key Points:**
- Payment gateway integration - Stripe, PayPal
- Payment intent - secure token generation
- Success/Failure handling - order creation or error
- Webhook validation - verify payment status

```mermaid
flowchart TD
    Checkout([User clicks checkout]) --> ValidateCart{Cart has items?}
    ValidateCart -->|No| ShowEmptyCart[Show empty cart message]
    ValidateCart -->|Yes| ShowCheckoutForm[Show checkout form]
    
    ShowCheckoutForm --> FillShipping[Fill shipping address]
    FillShipping --> SelectPayment{Payment method}
    
    SelectPayment -->|Credit Card| CardForm[Enter card details]
    SelectPayment -->|PayPal| PayPalRedirect[Redirect to PayPal]
    SelectPayment -->|Other| OtherGateway[Other payment gateway]
    
    CardForm --> SubmitPayment[Submit payment]
    PayPalRedirect --> PayPalAuth[Authorize on PayPal]
    PayPalAuth --> PayPalReturn[Return to site]
    
    SubmitPayment --> CreateIntent[Create payment intent]
    PayPalReturn --> CreateIntent
    
    CreateIntent --> SendToGateway[Send to payment gateway]
    SendToGateway --> GatewayProcess[Gateway processes payment]
    
    GatewayProcess --> PaymentResult{Payment result}
    
    PaymentResult -->|Success| RecordPayment[Record payment in DB]
    PaymentResult -->|Declined| ShowDeclined[Show declined message]
    PaymentResult -->|Error| ShowPaymentError[Show error message]
    
    RecordPayment --> CreateOrder[Create order]
    CreateOrder --> ClearCart[Clear user cart]
    ClearCart --> SendConfirmation[Send confirmation email]
    SendConfirmation --> ShowSuccess[Show success page with order ID]
    
    ShowDeclined --> RetryOption{Retry?}
    RetryOption -->|Yes| ShowCheckoutForm
    RetryOption -->|No| ReturnToCart[Return to cart]
    
    ShowPaymentError --> ContactSupport[Show support contact]
    ContactSupport --> End([End])
    
    ShowSuccess --> End
    ReturnToCart --> End
    ShowEmptyCart --> End
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class Checkout start
    class ValidateCart,SelectPayment,PaymentResult,RetryOption decision
    class ShowEmptyCart,ShowCheckoutForm,FillShipping,CardForm,PayPalRedirect,PayPalAuth,PayPalReturn,OtherGateway,SubmitPayment,CreateIntent,SendToGateway,GatewayProcess,RecordPayment,CreateOrder,ClearCart,SendConfirmation,ReturnToCart,ContactSupport process
    class ShowSuccess,End success
    class ShowDeclined,ShowPaymentError error
    class RecordPayment,CreateOrder database
```

---

## 🔄 Token Refresh & Session Management

> **מטרה:** Token פג תוקף? Refresh אותו אוטומטית בלי להפריע למשתמש

**🔑 Key Points:**
- Access token - 15 minutes validity
- Refresh token - 7 days validity
- Auto-refresh - בפחות מ-500ms
- Logout all - כשמחליפים סיסמה

```mermaid
flowchart TD
    ApiCall([User makes API call]) --> SendRequest[Send request with token]
    SendRequest --> ServerCheck[Server checks token]
    
    ServerCheck --> TokenStatus{Token status}
    
    TokenStatus -->|Valid| ProcessRequest[Process request normally]
    TokenStatus -->|Expired| CheckRefreshToken{Has refresh token?}
    TokenStatus -->|Invalid| Return401[Return 401]
    
    CheckRefreshToken -->|No| Return401
    CheckRefreshToken -->|Yes| ValidateRefreshToken[Validate refresh token]
    
    ValidateRefreshToken --> RefreshValid{Refresh token valid?}
    RefreshValid -->|No| Return401
    RefreshValid -->|Yes| GenerateNewTokens[Generate new access & refresh tokens]
    
    GenerateNewTokens --> SendNewTokens[Send new tokens in response]
    SendNewTokens --> UpdateClient[Client updates stored tokens]
    UpdateClient --> RetryOriginalRequest[Retry original API call]
    RetryOriginalRequest --> ProcessRequest
    
    ProcessRequest --> SendResponse[Send successful response]
    
    Return401 --> ClientReceives401[Client receives 401]
    ClientReceives401 --> ClearAuth[Clear authentication state]
    ClearAuth --> RedirectLogin[Redirect to login page]
    
    SendResponse --> End([End])
    RedirectLogin --> End
    
    %% Styling
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef start fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class ApiCall start
    class TokenStatus,CheckRefreshToken,RefreshValid decision
    class SendRequest,ServerCheck,ProcessRequest,ValidateRefreshToken,GenerateNewTokens,SendNewTokens,UpdateClient,RetryOriginalRequest,SendResponse,ClientReceives401,ClearAuth,RedirectLogin process
    class SendResponse,End success
    class Return401 error
```

---

## 🎯 Summary & How to Use This Document

### 📚 למה קובץ זה שימושי:

✅ **הבנה מוקדמת** - ראה את כל הקומבינציות לפני לקוד  
✅ **Debugging** - עקוב אחרי הזרימה לדע בדיוק איפה הבעיה  
✅ **Planning** - תכנן features חדשות עם context מלא  
✅ **Onboarding** - הערים צוות חדש בחצי השעה במקום שבועות  
✅ **Documentation** - תיעוד שמעולם לא התישן  

### 🎯 איך להשתמש:

1. **בחר את הסקציה שלך** - תלוי בתפקיד
2. **קרא את ה-diagram משמאל לימין** - בעקבות החיצים
3. **הבן כל decision point** - מה הפעולה בכל תנאי
4. **חזור כשצריך** - הו reference שמעדכנים עם הכל

### 🔧 איך עוديים אלו:

כל תרשים יכול להעדכן:
- כשיש feature חדשה
- כשמצאים bug ותיקון הזרימה
- כשיש optimization או refactor

---

## 💡 Best Practices לקריאת Diagrams

| טריק | הסבר |
|------|-----|
| **Follow arrows** | כל חץ = פעולה הבאה בזרימה |
| **Check diamonds** | כל ◇ = decision point, יש multiple paths |
| **Read labels** | כל box יש תיאור בדיוק מה קורה שם |
| **Use colors** | צבעים עוזרים להבדיל בין success/error/process |
| **Zoom in** | VS Code preview - אפשר להזום ולראות פרטים |

---

**Perfect for:**
- 🎯 **Understanding** - הבן את כל המערכת
- 🔧 **Debugging** - מצא באגים בדיוק בנקודה
- 📋 **Planning** - תכנן features חדשות בנבון
- 👥 **Onboarding** - הערים צוות חדש בחצי שעה
- 📚 **Documentation** - Reference שמעולם לא מתישן