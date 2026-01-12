# Payment System - Setup Guide

## Architecture

The payment system uses a **provider pattern** for maximum flexibility:

```
PaymentProvider (interface)
    ├── MockProvider (development/testing)
    ├── StripeProvider (production)
    └── [Add more: PayPalProvider, SquareProvider, etc.]
```

## Current Configuration

### Payment Methods Supported
- `stripe` - Online card payments via Stripe (requires `sessionId`)
- `cash_on_delivery` - Pay when receiving order (no `sessionId` needed)
- `bank_transfer` - Manual bank transfer (no `sessionId` needed)

### Adding New Payment Methods
Edit `server/src/validators/order.validator.ts`:
```typescript
export const PaymentMethodEnum = z.enum([
  "stripe",
  "cash_on_delivery", 
  "bank_transfer",
  "paypal",        // Add here
  "apple_pay",     // Add here
]);
```

---

## Setup Instructions

### Option 1: Development (Mock Provider)
```env
# .env
PAYMENT_PROVIDER=mock
```
- No external setup needed
- All payments auto-succeed
- Perfect for testing

### Option 2: Production (Stripe)

#### 1. Install Stripe SDK
```bash
cd server
npm install stripe
```

#### 2. Get Stripe Keys
1. Create account at https://stripe.com
2. Go to https://dashboard.stripe.com/apikeys
3. Copy **Secret key** (starts with `sk_test_` or `sk_live_`)

#### 3. Configure Environment
```env
# .env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYMENT_CURRENCY=ILS
CLIENT_URL=http://localhost:3000
```

#### 4. Setup Webhook (for payment confirmations)
1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Set URL: `https://yourdomain.com/api/payments/webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy **Signing secret** to `STRIPE_WEBHOOK_SECRET`

#### 5. Restart Server
```bash
npm run dev
```

---

## Usage

### Client Flow for Stripe Payment

```typescript
// 1. Create order with Stripe
POST /api/orders
{
  "paymentMethod": "stripe",
  "shippingAddress": {...}
}
// Response: { order: {...} }

// 2. Create payment intent
POST /api/payments/create-intent
{
  "orderId": "..." 
}
// Response: { 
//   checkoutUrl: "https://checkout.stripe.com/...",
//   clientSecret: "..."
// }

// 3. Redirect user to checkoutUrl
window.location.href = response.checkoutUrl;

// 4. After payment, Stripe redirects to:
// Success: http://localhost:3000/orders/{orderId}?payment=success
// Cancel: http://localhost:3000/checkout?payment=cancelled

// 5. Check payment status
GET /api/payments/{orderId}/status
// Response: { status: "paid", amount: 999, ... }
```

### Client Flow for Cash on Delivery

```typescript
// Simply create order without sessionId
POST /api/orders
{
  "paymentMethod": "cash_on_delivery",
  "shippingAddress": {...}
}
// Response: { order: { paymentStatus: "pending" } }

// No payment intent needed
// Order status updates manually by admin
```

---

## Adding New Providers

### Example: PayPal

**1. Create Provider**
```typescript
// server/src/services/payments/paypal.provider.ts
import { PaymentProvider } from "./payment.provider";

export class PayPalProvider implements PaymentProvider {
  name = "paypal";
  
  async createPaymentIntent(params) {
    // PayPal API integration
  }
  
  async getPaymentStatus(id) {
    // Check PayPal payment
  }
  
  async handleWebhook(req) {
    // Verify PayPal webhook
  }
}
```

**2. Register Provider**
```typescript
// server/src/services/payment.service.ts
import { PayPalProvider } from "./payments/paypal.provider";

const providers = {
  mock: new MockProvider(),
  stripe: new StripeProvider(),
  paypal: new PayPalProvider(),  // Add here
};
```

**3. Add to Validator**
```typescript
// server/src/validators/order.validator.ts
export const PaymentMethodEnum = z.enum([
  "stripe",
  "cash_on_delivery",
  "bank_transfer",
  "paypal",  // Add here
]);
```

**4. Configure**
```env
PAYMENT_PROVIDER=paypal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET=your_secret
```

Done! The system automatically uses the new provider.

---

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Add `STRIPE_SECRET_KEY=sk_test_...` to `.env`
- Restart server

### Payments always pending
- Check `PAYMENT_PROVIDER` in `.env` (should be `stripe`, not `mock`)
- Verify Stripe webhook is configured
- Check webhook secret matches

### Webhook signature failed
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Verify endpoint URL in Stripe dashboard
- Check request is reaching `/api/payments/webhook`

---

## Testing

### Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires 3DS: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
```

### Mock Provider Testing
```bash
# Set in .env
PAYMENT_PROVIDER=mock

# All payments succeed instantly
# No external dependencies
```
