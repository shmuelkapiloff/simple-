# 🚀 Quick Start - Checkout System Testing

## Start the Application

### Terminal 1: Start Client (Vite)
```bash
cd client
npm run dev
# Opens at http://localhost:3000/
```

### Terminal 2: Start Server (Express)
```bash
cd server
npm run dev
# Runs on http://localhost:4001
```

---

## 🧪 Manual Test Flow

### Scenario 1: Auth Guard - Add to Cart
**Goal:** Verify unauth user gets auth modal when adding to cart

Steps:
1. Open http://localhost:3000/ (not logged in)
2. Click "🛒 הוסף לעגלה" on any product
3. ✅ **Expected:** AuthModal opens with message "התחבר כדי להוסיף לעגלה"
4. Log in with test account
5. ✅ **Expected:** Modal closes, item added to cart

---

### Scenario 2: Cart Hardening - View Cart
**Goal:** Verify cart operations require auth

Steps:
1. (Logged in from Scenario 1)
2. Click "🛒 עגלה" in NavBar
3. ✅ **Expected:** Cart loads with items from session
4. Try to update quantity or remove item
5. ✅ **Expected:** Operations work smoothly
6. Log out from NavBar
7. Refresh cart modal
8. ✅ **Expected:** Cart shows empty or error (not logged in)

---

### Scenario 3: Address Selection
**Goal:** Verify address selection persists to checkout

Steps:
1. (Logged in)
2. Open Cart → see "אנא בחר כתובת להחזקה" 
3. Click "בחר כתובת קיימת"
4. ✅ **Expected:** Address selector modal opens
5. Select an address or create new one
6. ✅ **Expected:** Address persists in localStorage
7. Close cart, reopen
8. ✅ **Expected:** Same address still selected

---

### Scenario 4: Complete Checkout (Happy Path)
**Goal:** Full flow from cart to order confirmation

Steps:
1. (Logged in, items in cart)
2. Click "עבור לתשלום" in Cart
3. ✅ **Expected:** Redirect to /checkout
4. Verify step 0: Cart summary shows
5. Click "הבא" → Step 1: Address selection
6. Select/create address → "הבא"
7. ✅ **Expected:** Step 2: Payment method (Stripe selected)
8. Click "בצע תשלום"
9. ✅ **Expected:** Redirects to Stripe checkout
10. Use test card: `4242 4242 4242 4242`
11. Complete payment on Stripe
12. ✅ **Expected:** 
    - Redirects back to Checkout with `?payment=success&orderId=XXX`
    - Toast: "✅ התשלום הסתיים בהצלחה!"
    - Cart clears
    - (Optional) Navigate to /orders/{orderId}

---

### Scenario 5: Payment Status Polling
**Goal:** Verify payment status confirmation

Steps:
1. (After Scenario 4 payment)
2. Check browser Network tab
3. Watch for repeated calls to `/api/payments/status/{orderId}`
4. ✅ **Expected:** Polling starts every 3 seconds
5. ✅ **Expected:** Stops after confirming paymentStatus: "paid"
6. Check console for cart clear logs
7. ✅ **Expected:** Log shows cart cleared after confirmed

---

### Scenario 6: Failed Payment & Retry
**Goal:** Verify failed payment recovery flow

Steps:
1. Start new checkout flow
2. Use declined test card: `4000 0000 0000 0002`
3. ✅ **Expected:** Payment fails, redirects with `?payment=cancelled`
4. Navigate to /orders
5. ✅ **Expected:** Order shows ❌ "נכשל" payment badge
6. Click "💳 נסה שוב" button
7. ✅ **Expected:** Opens new Stripe session
8. Complete with success card `4242 4242 4242 4242`
9. ✅ **Expected:** Payment succeeds, cart clears, success toast

---

### Scenario 7: Session Expiry & 401 Recovery
**Goal:** Verify automatic auth recovery

Steps:
1. (Logged in, cart open)
2. Open DevTools → Application → LocalStorage
3. Delete the `token` entry
4. Try to add item to cart or update quantity
5. ✅ **Expected:** API call returns 401
6. ✅ **Expected:** AuthModal opens automatically
7. Log in again with same account
8. ✅ **Expected:** Modal closes, operation can retry

---

## 🧮 Test Cards (Stripe)

### Success
- Card: `4242 4242 4242 4242`
- Exp: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ✅ Result: Payment succeeds

### Declined
- Card: `4000 0000 0000 0002`
- Exp: Any future date
- CVC: Any 3 digits
- ❌ Result: Payment declines (simulate failure)

### Pending
- Card: `4000 0000 0000 0341`
- Exp: Any future date
- CVC: Any 3 digits
- ⏳ Result: Payment pending (simulate long processing)

---

## 🐛 Debugging Tips

### Check Auth State
```javascript
// In browser console
store.getState().auth
// Look for: isAuthenticated, user, showAuthModal, authModalView
```

### Check Cart State
```javascript
store.getState().cart
// Look for: items, sessionId, selectedAddressId
```

### Monitor API Calls
1. Open DevTools → Network tab
2. Filter by "XHR" (XMLHttpRequest)
3. Add to cart → watch for:
   - `POST /api/cart/add` (401 if not auth)
   - `GET /api/cart/{sessionId}` (skipped if not auth)

### Check Payment Polling
1. Open DevTools → Network tab
2. Complete payment, return to Checkout
3. Watch for repeated `GET /api/payments/status/{orderId}`
4. Should poll every 3 seconds until confirmed

### localStorage Keys
```javascript
// In browser console
localStorage
// Look for: token, cart_sessionId, selectedAddressId
```

---

## ✅ Verification Checklist

- [ ] Unauth → Add to Cart → Modal appears
- [ ] Log in → Modal closes → Item added
- [ ] Cart mutations blocked without auth
- [ ] Address selection persists
- [ ] Checkout stepper loads (0→1→2→3)
- [ ] Stripe redirect works
- [ ] Success return detected
- [ ] Payment status polled
- [ ] Cart cleared on confirmation
- [ ] Orders page shows payment badge
- [ ] Retry button visible for failed payments
- [ ] Session expiry → Auth modal auto-appears
- [ ] All error messages in Hebrew

---

## 📞 Common Issues

### Issue: "Cart modal shows but can't select address"
**Solution:** Check browser console for API errors; verify server running

### Issue: "Payment redirects to Stripe but doesn't return"
**Solution:** Check STRIPE_PUBLISHABLE_KEY env in browser console

### Issue: "Cart doesn't clear after payment"
**Solution:** Check Network tab for `clearCart` mutation response

### Issue: "Orders page doesn't load"
**Solution:** Log in first; page gated by auth check

---

## 🎯 Success Criteria

All of these must work:
- ✅ Auth guard prevents unauth cart operations
- ✅ 401 responses trigger auth modal automatically  
- ✅ Checkout flow detects payment return params
- ✅ Payment status polling confirms payment
- ✅ Cart clears only after confirmed payment
- ✅ Orders show payment status badges
- ✅ Retry button works for failed payments
- ✅ All UX is in Hebrew with proper RTL layout

---

## 🚀 Ready to Deploy!

Once all scenarios pass, the checkout system is production-ready.

**Key Features Deployed:**
- ✅ Stripe integration with redirects
- ✅ Auth guards on all payment operations
- ✅ Automatic session recovery
- ✅ Payment status tracking
- ✅ Cart synchronization
- ✅ Hebrew localization

Enjoy! 🎉
