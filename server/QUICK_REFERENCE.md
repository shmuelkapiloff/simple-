# 🚀 Quick Reference: New Implementation Features

## Payment Validators Usage

### In Route Files

```typescript
import { validateRequest } from "../middlewares/validate.middleware";
import { createPaymentIntentSchema } from "../validators";

router.post(
  "/create-intent",
  validateRequest({ body: createPaymentIntentSchema }),
  PaymentController.createIntent
);
```

### Available Schemas

```typescript
✅ createPaymentIntentSchema - Validates orderId
✅ paymentStatusParamsSchema - Validates orderId in params
✅ processRefundSchema - Validates reason, amount
✅ confirmPaymentSchema - Validates clientSecret
```

---

## Error Messages Usage

### In Services/Controllers

```typescript
import { ApiErrors } from "../errors/api-errors";

// Throw errors:
throw new Error(ApiErrors.Payment.OrderNotFound);
throw new Error(ApiErrors.Cart.InsufficientStock);

// Send error responses:
return sendError(res, 404, ApiErrors.Order.NotFound);
return sendError(res, 400, ApiErrors.Validation.InvalidEmail);
```

### Available Error Categories

```typescript
ApiErrors.Auth          // 6 messages
ApiErrors.Authorization // 3 messages
ApiErrors.Validation    // 9 messages
ApiErrors.Product       // 5 messages
ApiErrors.Cart          // 7 messages
ApiErrors.Order         // 10 messages
ApiErrors.Payment       // 13 messages
ApiErrors.User          // 6 messages
ApiErrors.Address       // 6 messages
ApiErrors.PasswordReset // 5 messages
ApiErrors.Database      // 6 messages
ApiErrors.Stripe        // 5 messages
ApiErrors.RateLimit     // 4 messages
ApiErrors.Server        // 8 messages
```

### Dynamic Error Messages

```typescript
const minutesRemaining = 5;
const msg = ApiErrors.Auth.AccountLockedMinutes(minutesRemaining);
// Result: "Account locked for 5 minutes due to failed login attempts"
```

---

## Validation Middleware

### Validate Multiple Areas

```typescript
router.post(
  "/products",
  validateRequest({
    body: createProductSchema,
    query: paginationSchema,
    params: productIdSchema
  }),
  ProductController.create
);
```

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "body.orderId: Invalid MongoDB ObjectId format",
    "body.amount: Number must be greater than 0"
  ]
}
```

---

## Integration Checklist

When adding validation to new endpoints:

- [ ] Import validateRequest middleware
- [ ] Create/import Zod schema from validators/
- [ ] Add validateRequest to route with schema
- [ ] Update exports in validators/index.ts if new schema
- [ ] Test with valid and invalid data
- [ ] Commit with message "feat: Add validation for [endpoint]"

---

## Example: Adding Validation to New Endpoint

### Step 1: Create Validator Schema

```typescript
// validators/checkout.validator.ts
export const checkoutSchema = z.object({
  cartId: objectIdSchema,
  promoCode: z.string().optional(),
});
```

### Step 2: Export from Index

```typescript
// validators/index.ts
export {
  checkoutSchema,
  type CheckoutInput,
} from "./checkout.validator";
```

### Step 3: Update Route

```typescript
// routes/checkout.routes.ts
import { validateRequest } from "../middlewares/validate.middleware";
import { checkoutSchema } from "../validators";

router.post(
  "/validate",
  validateRequest({ body: checkoutSchema }),
  CheckoutController.validate
);
```

### Step 4: Test

```bash
# Valid request
curl -X POST http://localhost:4001/api/checkout/validate \
  -H "Content-Type: application/json" \
  -d '{"cartId": "507f1f77bcf86cd799439011"}'

# Invalid request (bad ObjectId)
curl -X POST http://localhost:4001/api/checkout/validate \
  -H "Content-Type: application/json" \
  -d '{"cartId": "not-a-valid-id"}'
# Returns 400 with validation error
```

---

## Performance Impact

✅ **No Performance Degradation**
- Validation happens once at route middleware level
- Schemas are pre-compiled by Zod
- Error centralization has zero runtime cost

✅ **Early Filtering**
- Invalid data rejected at route level
- Services never receive bad data
- Reduces downstream validation needs

---

## Git Commits Reference

| Commit | Feature |
|--------|---------|
| ec3421a | Payment validators + middleware |
| c38d384 | Error constants (108 messages) |
| ee14728 | Phase 1 implementation summary |

---

## Next Phase Tasks

1. **Integrate ApiErrors into PaymentService** (2-3 hrs)
   - Replace ~15 hardcoded error strings
   - Update payment.service.ts, order.service.ts

2. **Extend Validators to Cart Endpoints** (2-3 hrs)
   - Add cart.validator.ts with add/update schemas
   - Integrate into cart.routes.ts

3. **Add Sentry Integration** (1-2 hrs)
   - Error tracking for production
   - Non-breaking addition

---

**Questions?** Check the inline comments in the source files or review IMPLEMENTATION_PHASE_1.md
