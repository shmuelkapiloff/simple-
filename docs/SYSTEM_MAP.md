# 🗺️ Simple Shop - Complete Visual System Map

## 📋 Quick Navigation
- [🗺️ Simple Shop - Complete Visual System Map](#️-simple-shop---complete-visual-system-map)
  - [📋 Quick Navigation](#-quick-navigation)
  - [🏗️ System Architecture](#️-system-architecture)
  - [🔐 Authentication Flow with Conditions](#-authentication-flow-with-conditions)
  - [🛒 Cart Flow with Multiple Conditions](#-cart-flow-with-multiple-conditions)
  - [📦 Orders System Flow](#-orders-system-flow)
  - [👤 Profile Management Flow](#-profile-management-flow)
  - [🔄 Cart Merge Flow (Login/Register)](#-cart-merge-flow-loginregister)
  - [🎭 State Management Flow with Redux](#-state-management-flow-with-redux)
  - [🔄 Complete Component Lifecycle with Conditions](#-complete-component-lifecycle-with-conditions)
  - [❌ Error Handling Flow Map](#-error-handling-flow-map)
  - [🎯 Summary](#-summary)

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
    
    CreateGuestSession --> AddToGuestCart[🛒 Add to guest cart]
    UseExistingSession --> AddToGuestCart
    
    %% Logged-in Flow
    LoggedInFlow --> CheckUserCart{🛒 Has existing cart?}
    CheckUserCart -->|❌ No| CreateUserCart[🆕 Create user cart]
    CheckUserCart -->|✅ Yes| CheckExistingItem{🔍 Item already in cart?}
    
    CreateUserCart --> AddNewItem[➕ Add new item]
    
    CheckExistingItem -->|❌ No| AddNewItem
    CheckExistingItem -->|✅ Yes| UpdateQuantity[🔄 Update quantity]
    
    %% Cart Operations
    AddToGuestCart --> SaveToRedis[(⚡ Save to Redis)]
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
    class CheckProduct,CheckStock,CheckQuantity,CheckUser,CheckGuestSession,CheckUserCart,CheckExistingItem,CheckCartCount decision
    class ProductError,StockError,QuantityError,ErrorEnd error
    class LowStockWarning warning
    class LoggedInFlow,GuestFlow,CreateGuestSession,UseExistingSession,CreateUserCart,AddNewItem,UpdateQuantity,AddToGuestCart,UpdateUI,HideCartBadge,ShowSimpleBadge,ShowPlusBadge process
    class SaveToRedis,SaveToMongoDB,UpdateRedisCache database
    class Success success
```

---

## 📦 Orders System Flow

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
```

---

## 🔄 Complete Component Lifecycle with Conditions

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
```

---

## ❌ Error Handling Flow Map

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
```

---

## 🎯 Summary

This visual map provides:

✅ **Complete System Overview** - All layers from UI to Database  
✅ **Detailed Condition Logic** - Every decision point mapped  
✅ **Orders System** - Complete order creation, tracking, and cancellation flows  
✅ **Profile Management** - User profile updates, password changes, account deletion  
✅ **Cart Merging** - Guest to user cart merge on login/register  
✅ **Error Handling** - Comprehensive error recovery flows  
✅ **State Management** - Redux state transitions  
✅ **Component Lifecycle** - Full initialization to runtime  
✅ **User Journey** - Every possible user interaction  

**How to use:**
1. Copy this content to `docs/SYSTEM_MAP.md`
2. View in GitHub/VS Code with Mermaid preview
3. Each diagram is interactive and shows the complete logic flow
4. Update by editing the text - diagrams auto-generate

**Perfect for:**
- 🎯 **Understanding** the complete system
- 🔧 **Debugging** issues by following the flow
- 📋 **Planning** new features
- 👥 **Onboarding** new team members
- 📚 **Documentation** and maintenance