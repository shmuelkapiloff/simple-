# 🚀 Production-Ready Payment System with Stripe

## סיכום שינויים שבוצעו

### ✅ הוסר קוד דמו/בדיקה
- ❌ נמחק `StripeElementsFormDemo.tsx` - טופס הדגמה
- ❌ נמחק `StripeElementsForm.tsx` - טופס inline 
- ❌ נמחק `mock.provider.ts` - ספק תשלומים מדומה
- ✅ Checkout עובד רק עם Stripe Checkout (redirect flow)

### ✅ חיזוק אבטחת Webhook
- ✅ הוסף `express.raw()` middleware ל-`/api/payments/webhook`
- ✅ חתימת Stripe מאומתת ב-`stripe.provider.ts`
- ✅ Raw body נשמר לצורך אימות חתימה

### ✅ מניעת עיבוד כפול (Idempotency)
- ✅ נוצר `WebhookEventModel` לשמירת events שעובדו
- ✅ Webhook בודק `eventId` קודם לעיבוד
- ✅ TTL index מוחק events ישנים אוטומטית (30 יום)

### ✅ שיפורי Order Schema
- ✅ הוסף `pending_payment` לסטטוסי הזמנה
- ✅ הוסר `mock` מ-`paymentProvider` enum
- ✅ הזמנה עוברת ל-`pending_payment` עד אישור תשלום

### ✅ Logging מובנה
- ✅ החלפת `console.log` ב-`log` מובנה
- ✅ מעקב אחר duration, errors, ו-context
- ✅ לוגים ב-`PaymentService` ו-`PaymentController`

### ✅ אכיפת Stripe בייצור
- ✅ Environment validation ב-`env.ts`
- ✅ שגיאה אם `STRIPE_SECRET_KEY` חסר כאשר `PAYMENT_PROVIDER=stripe`
- ✅ אזהרה אם `STRIPE_WEBHOOK_SECRET` חסר

---

## 🔧 Setup Instructions

### 1. צור חשבון Stripe
1. לך ל-[stripe.com/register](https://dashboard.stripe.com/register)
2. צור חשבון (או התחבר)
3. בחר **Developers → API Keys**

### 2. קבל את ה-API Keys
במצב **Test mode** (למעלה משמאל), העתק:
- **Publishable key** (מתחיל ב-`pk_test_...`) - ללקוח
- **Secret key** (מתחיל ב-`sk_test_...`) - לשרת

### 3. הגדר Webhook
1. לך ל-**Developers → Webhooks**
2. לחץ **Add endpoint**
3. הזן URL: `https://your-domain.com/api/payments/webhook`
   - בפיתוח: השתמש ב-[Stripe CLI](#stripe-cli-למבחנים-מקומיים) או [ngrok](https://ngrok.com)
4. בחר Events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. העתק את **Signing secret** (מתחיל ב-`whsec_...`)

### 4. עדכן `.env` בשרת
```bash
# server/.env
NODE_ENV=production
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
CLIENT_URL=https://your-frontend-domain.com
PAYMENT_CURRENCY=ILS

# MongoDB (נדרש בייצור)
MONGO_URI=mongodb://your-mongo-connection-string

# JWT (נדרש בייצור)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

### 5. עדכן `.env` בלקוח (אופציונלי)
```bash
# client/.env
VITE_API_URL=https://your-backend-domain.com
```

---

## 🧪 Stripe CLI למבחנים מקומיים

### התקנה
```powershell
# Windows (Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### התחברות
```bash
stripe login
```

### העברת webhooks לשרת מקומי
```bash
stripe listen --forward-to http://localhost:4001/api/payments/webhook
```
העתק את ה-webhook signing secret שמודפס (מתחיל ב-`whsec_...`) ל-`.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### בדיקת תשלום
```bash
stripe trigger checkout.session.completed
```

---

## 🧾 כרטיסי בדיקה (Test Mode)

| מצב | מספר כרטיס | CVC | תאריך תפוגה |
|-----|-----------|-----|-------------|
| ✅ הצלחה | `4242 4242 4242 4242` | כל 3 ספרות | עתידי |
| ❌ דחייה | `4000 0000 0000 0002` | כל 3 ספרות | עתידי |
| 🔐 3D Secure | `4000 0025 0000 3155` | כל 3 ספרות | עתידי |
| 💳 Insufficient Funds | `4000 0000 0000 9995` | כל 3 ספרות | עתידי |

מידע נוסף: [Stripe Test Cards](https://stripe.com/docs/testing)

---

## 🔄 זרימת התשלום המלאה

### לקוח (Client)
1. משתמש לוחץ "אשר הזמנה ושלם" ב-Checkout
2. `createOrderMutation` → יוצר הזמנה עם סטטוס `pending_payment`
3. `createPaymentIntent` → מקבל `checkoutUrl` מ-Stripe
4. הדפדפן מנתב ל-Stripe Checkout (`session.url`)
5. משתמש משלם ב-Stripe
6. Stripe מחזיר ל-`/checkout?payment=success&orderId=X`
7. `useGetPaymentStatusQuery` מפעיל polling כל 3 שניות
8. כאשר `paymentStatus === "paid"` → ניקוי עגלה ומעבר לעמוד הזמנה

### שרת (Server)
1. `POST /api/orders` → יצירת הזמנה (`status: "pending_payment"`)
2. `POST /api/payments/create-intent` → יצירת Stripe Checkout Session
3. ⏳ ממתין ל-webhook מ-Stripe...
4. `POST /api/payments/webhook` (מופעל על ידי Stripe):
   - אימות חתימה (`stripe.webhooks.constructEvent`)
   - בדיקת idempotency (`WebhookEventModel`)
   - `checkout.session.completed` → עדכון הזמנה ל-`confirmed`
   - הפחתת מלאי מוצרים
   - ניקוי עגלה
   - שמירת event ב-DB למניעת עיבוד כפול
5. `GET /api/payments/:orderId/status` → מחזיר סטטוס עדכני

---

## 🛡️ אבטחה

### ✅ מה כבר מיושם
- Webhook signature verification (Stripe SDK)
- Raw body parsing ל-webhook endpoint
- Idempotency tracking (מונע עיבוד כפול)
- Environment validation (דורש keys בייצור)
- HTTPS בייצור (דרך reverse proxy)
- CORS מוגבל לדומיינים מאושרים

### 🔒 המלצות נוספות
1. **Rate Limiting**: הגבל webhooks למניעת DoS
   ```typescript
   import rateLimit from 'express-rate-limit';
   app.use('/api/payments/webhook', rateLimit({
     windowMs: 15 * 60 * 1000, // 15 דקות
     max: 100 // מקסימום 100 בקשות
   }));
   ```

2. **Webhook IP Whitelisting**: אפשר רק מ-IP של Stripe
   - [Stripe IP ranges](https://stripe.com/docs/ips)

3. **Monitoring**: הגדר התראות על כישלונות תשלום
   - Sentry / Datadog / CloudWatch

4. **PCI Compliance**: Stripe Checkout כבר DSS Level 1 compliant

---

## 🧪 בדיקות

### הרצת בדיקות קיימות
```bash
cd server
npm test
```

### בדיקה ידנית
1. הרץ server: `npm run dev`
2. הרץ client: `cd client && npm run dev`
3. צור הזמנה והשתמש בכרטיס בדיקה `4242 4242 4242 4242`
4. בדוק webhook logs:
   ```bash
   stripe logs tail
   ```

### בדיקת webhook ידנית
```bash
curl -X POST http://localhost:4001/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"id":"evt_test","type":"checkout.session.completed","data":{"object":{"id":"cs_test","payment_status":"paid"}}}'
```
**שים לב**: בייצור זה ייכשל ללא חתימה תקינה (מומלץ!)

---

## 📊 Monitoring & Logging

### לוגים מובנים
```typescript
// Logs נשמרים אוטומטית עם:
log.info("Payment confirmed", { orderId, amount });
log.error("Webhook failed", { error: err.message });
```

### צפייה בלוגים
```bash
# Development (pretty print)
npm run dev

# Production (JSON)
NODE_ENV=production npm start | pino-pretty
```

### מדדים חשובים למעקב
- 💰 **סכום תשלומים מוצלח** (daily/weekly/monthly)
- ⏱️ **זמן עיבוד webhook** (מטרה: <500ms)
- ❌ **שיעור כישלון** (מטרה: <2%)
- 🔄 **webhook retries** (כמה פעמים Stripe שולח שוב)

---

## 🚀 העלאה לייצור (Production)

### Checklist
- [ ] `NODE_ENV=production`
- [ ] `STRIPE_SECRET_KEY` ל-Live mode (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` ל-Live webhook
- [ ] `CLIENT_URL` לדומיין אמיתי
- [ ] `JWT_SECRET` חזק (32+ תווים אקראיים)
- [ ] MongoDB Atlas / AWS DocumentDB
- [ ] HTTPS מופעל (Let's Encrypt / CloudFlare)
- [ ] Webhook endpoint נגיש מאינטרנט
- [ ] Rate limiting מופעל
- [ ] Monitoring מוגדר (Sentry/Datadog)
- [ ] Backup אוטומטי ל-MongoDB

### דוגמת Deploy (Heroku)
```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set CLIENT_URL=https://myshop.com

# Deploy
git push heroku main

# Update Stripe webhook endpoint
# Developers → Webhooks → Add endpoint
# URL: https://your-app.herokuapp.com/api/payments/webhook
```

---

## 🆘 Troubleshooting

### בעיה: Webhook לא מתקבל
**פתרון**:
1. בדוק ש-endpoint נגיש מהאינטרנט
2. ודא ש-`STRIPE_WEBHOOK_SECRET` נכון
3. בדוק logs: `stripe logs tail`
4. בדוק firewall/security groups

### בעיה: "Webhook signature verification failed"
**פתרון**:
1. ודא `express.raw()` middleware לפני `express.json()`
2. בדוק ש-`STRIPE_WEBHOOK_SECRET` מתאים ל-endpoint
3. אל תעשה JSON.parse על `req.body` בwebhook

### בעיה: עגלה לא מתנקה אחרי תשלום
**פתרון**:
1. בדוק שה-webhook התקבל (`stripe logs tail`)
2. ודא `checkout.session.completed` מוגדר ב-webhook events
3. בדוק logs של server: `npm run dev`

### בעיה: Duplicate webhooks
**פתרון**:
- המערכת כבר מטפלת בזה! `WebhookEventModel` שומר events מעובדים
- אם עדיין יש בעיה, בדוק TTL index: `db.webhookevents.getIndexes()`

---

## 📚 מסמכים נוספים
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Guide](https://stripe.com/docs/testing)

---

**נוצר**: ינואר 2026  
**גרסה**: 1.0.0  
**מצב**: Production-Ready ✅
