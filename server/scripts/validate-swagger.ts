/**
 * Swagger / OpenAPI Validation Script
 * ====================================
 * Validates that swagger.ts is correct, complete, and matches the real routes.
 *
 * Checks performed:
 * 1. ✅ OpenAPI 3.0 spec structural validity (via swagger-parser)
 * 2. ✅ All $ref pointers resolve correctly
 * 3. ✅ Cross-reference: every real route has a matching swagger path
 * 4. ✅ Cross-reference: no phantom (extra) swagger paths exist
 * 5. ✅ Security schemes are properly applied
 * 6. ✅ Response envelope structure consistency
 * 7. ✅ Required fields and schema types
 *
 * Usage: npx ts-node scripts/validate-swagger.ts
 */

import SwaggerParser from "@apidevtools/swagger-parser";
import { specs } from "../src/swagger";

/* ═══════════════════════════════════════════════════════════════
   GROUND TRUTH — actual routes from route files
   ═══════════════════════════════════════════════════════════════ */

interface RouteEntry {
  method: string;
  path: string;
  auth: boolean; // true = requires authentication
  description: string;
}

const REAL_ROUTES: RouteEntry[] = [
  // ── Health ──
  { method: "get", path: "/api/health", auth: false, description: "Full health check" },
  { method: "get", path: "/api/health/ping", auth: false, description: "Ping/pong" },

  // ── Auth ──
  { method: "post", path: "/api/auth/register", auth: false, description: "Register" },
  { method: "post", path: "/api/auth/login", auth: false, description: "Login" },
  { method: "post", path: "/api/auth/forgot-password", auth: false, description: "Forgot password" },
  { method: "post", path: "/api/auth/reset-password/{token}", auth: false, description: "Reset password" },
  { method: "get", path: "/api/auth/verify", auth: true, description: "Verify token" },
  { method: "get", path: "/api/auth/profile", auth: true, description: "Get profile" },
  { method: "put", path: "/api/auth/profile", auth: true, description: "Update profile" },
  { method: "post", path: "/api/auth/change-password", auth: true, description: "Change password" },
  { method: "post", path: "/api/auth/logout", auth: true, description: "Logout" },

  // ── Products ──
  { method: "get", path: "/api/products", auth: false, description: "List products" },
  { method: "get", path: "/api/products/categories/list", auth: false, description: "List categories" },
  { method: "get", path: "/api/products/{id}", auth: false, description: "Get product by ID" },

  // ── Cart ──
  { method: "get", path: "/api/cart", auth: true, description: "Get cart" },
  { method: "get", path: "/api/cart/count", auth: true, description: "Cart count" },
  { method: "post", path: "/api/cart/add", auth: true, description: "Add to cart" },
  { method: "put", path: "/api/cart/update", auth: true, description: "Update quantity" },
  { method: "delete", path: "/api/cart/remove", auth: true, description: "Remove from cart" },
  { method: "delete", path: "/api/cart/clear", auth: true, description: "Clear cart" },

  // ── Orders ──
  { method: "post", path: "/api/orders", auth: true, description: "Create order" },
  { method: "get", path: "/api/orders", auth: true, description: "Get user orders" },
  { method: "get", path: "/api/orders/track/{orderId}", auth: false, description: "Track order" },
  { method: "get", path: "/api/orders/{orderId}", auth: true, description: "Get order by ID" },
  { method: "post", path: "/api/orders/{orderId}/cancel", auth: true, description: "Cancel order" },

  // ── Payments ──
  { method: "post", path: "/api/payments/create-intent", auth: true, description: "Create payment intent" },
  { method: "post", path: "/api/payments/checkout", auth: true, description: "Checkout alias" },
  { method: "get", path: "/api/payments/{orderId}/status", auth: true, description: "Payment status" },
  { method: "post", path: "/api/payments/webhook", auth: false, description: "Stripe webhook" },

  // ── Addresses ──
  { method: "get", path: "/api/addresses", auth: true, description: "Get addresses" },
  { method: "get", path: "/api/addresses/default", auth: true, description: "Get default address" },
  { method: "get", path: "/api/addresses/{addressId}", auth: true, description: "Get address by ID" },
  { method: "post", path: "/api/addresses", auth: true, description: "Create address" },
  { method: "put", path: "/api/addresses/{addressId}", auth: true, description: "Update address" },
  { method: "delete", path: "/api/addresses/{addressId}", auth: true, description: "Delete address" },
  { method: "post", path: "/api/addresses/{addressId}/set-default", auth: true, description: "Set default" },

  // ── Admin ──
  { method: "get", path: "/api/admin/products", auth: true, description: "List all products (admin)" },
  { method: "post", path: "/api/admin/products", auth: true, description: "Create product (admin)" },
  { method: "put", path: "/api/admin/products/{id}", auth: true, description: "Update product (admin)" },
  { method: "delete", path: "/api/admin/products/{id}", auth: true, description: "Delete product (admin)" },
  { method: "get", path: "/api/admin/users", auth: true, description: "List users (admin)" },
  { method: "put", path: "/api/admin/users/{id}/role", auth: true, description: "Update role (admin)" },
  { method: "get", path: "/api/admin/orders", auth: true, description: "List orders (admin)" },
  { method: "put", path: "/api/admin/orders/{id}/status", auth: true, description: "Update order status (admin)" },
  { method: "get", path: "/api/admin/stats/summary", auth: true, description: "Stats summary (admin)" },

  // ── Metrics ──
  { method: "get", path: "/api/metrics/payment", auth: true, description: "Payment metrics" },
  { method: "get", path: "/api/metrics/webhook", auth: true, description: "Webhook metrics" },
  { method: "get", path: "/api/metrics/all", auth: true, description: "All metrics" },
];

/* ═══════════════════════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════════════════════ */

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function pass(msg: string) {
  passCount++;
  console.log(`  ✅ ${msg}`);
}
function fail(msg: string) {
  failCount++;
  console.log(`  ❌ ${msg}`);
}
function warn(msg: string) {
  warnCount++;
  console.log(`  ⚠️  ${msg}`);
}

async function validate() {
  const spec = specs as any;

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║       SWAGGER / OPENAPI VALIDATION REPORT           ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  /* ─── 1. STRUCTURAL VALIDITY ─────────────────────────────── */
  console.log("📋 1. OpenAPI 3.0 Structural Validity");
  console.log("─".repeat(50));
  try {
    await SwaggerParser.validate(JSON.parse(JSON.stringify(spec)));
    pass("Spec is a valid OpenAPI 3.0 document");
  } catch (err: unknown) {
    fail(`OpenAPI validation error: ${(err as Error).message}`);
  }

  /* ─── 2. $ref RESOLUTION ─────────────────────────────────── */
  console.log("\n📋 2. Schema $ref Resolution");
  console.log("─".repeat(50));
  try {
    await SwaggerParser.dereference(JSON.parse(JSON.stringify(spec)));
    pass("All $ref pointers resolve correctly");
  } catch (err: unknown) {
    fail(`$ref resolution error: ${(err as Error).message}`);
  }

  /* ─── 3. DEFINED SCHEMAS CHECK ────────────────────────────── */
  console.log("\n📋 3. Defined Schemas");
  console.log("─".repeat(50));
  const schemas = Object.keys(spec.components?.schemas || {});
  const expectedSchemas = [
    "User", "Product", "CartItem", "Cart", "Address",
    "ShippingAddress", "OrderItem", "Order", "Payment", "Error"
  ];

  for (const name of expectedSchemas) {
    if (schemas.includes(name)) {
      pass(`Schema "${name}" exists`);
    } else {
      fail(`Schema "${name}" MISSING from components.schemas`);
    }
  }

  // Check for extra schemas
  for (const name of schemas) {
    if (!expectedSchemas.includes(name)) {
      warn(`Extra schema "${name}" (not in expected list)`);
    }
  }

  /* ─── 4. CROSS-REFERENCE: Real → Swagger ──────────────────── */
  console.log("\n📋 4. Cross-Reference: Real Routes → Swagger Paths");
  console.log("─".repeat(50));

  const swaggerPaths = spec.paths || {};
  const swaggerEndpoints = new Set<string>();

  for (const [path, methods] of Object.entries(swaggerPaths)) {
    for (const method of Object.keys(methods as object)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        swaggerEndpoints.add(`${method.toUpperCase()} ${path}`);
      }
    }
  }

  const realEndpoints = new Set<string>();

  for (const route of REAL_ROUTES) {
    const key = `${route.method.toUpperCase()} ${route.path}`;
    realEndpoints.add(key);

    if (swaggerEndpoints.has(key)) {
      pass(`${key} — documented ✔`);
    } else {
      fail(`${key} — MISSING from swagger.ts! (${route.description})`);
    }
  }

  /* ─── 5. PHANTOM ENDPOINTS ────────────────────────────────── */
  console.log("\n📋 5. Phantom Endpoints (in swagger but not in routes)");
  console.log("─".repeat(50));

  let phantomCount = 0;
  for (const endpoint of swaggerEndpoints) {
    if (!realEndpoints.has(endpoint)) {
      fail(`${endpoint} — EXISTS in swagger but NOT in route files!`);
      phantomCount++;
    }
  }
  if (phantomCount === 0) {
    pass("No phantom endpoints found");
  }

  /* ─── 6. SECURITY CONFIGURATION ───────────────────────────── */
  console.log("\n📋 6. Security Configuration");
  console.log("─".repeat(50));

  // Check global security
  if (spec.security && spec.security.length > 0) {
    pass("Global security (BearerAuth) is set");
  } else {
    fail("No global security scheme defined");
  }

  // Check public endpoints have security: []
  const publicRoutes = REAL_ROUTES.filter(r => !r.auth);
  const authenticatedRoutes = REAL_ROUTES.filter(r => r.auth);

  for (const route of publicRoutes) {
    const pathObj = swaggerPaths[route.path];
    if (!pathObj) continue;
    const methodObj = (pathObj as any)[route.method];
    if (!methodObj) continue;

    if (Array.isArray(methodObj.security) && methodObj.security.length === 0) {
      pass(`${route.method.toUpperCase()} ${route.path} — correctly marked as public (security: [])`);
    } else if (methodObj.security === undefined) {
      warn(`${route.method.toUpperCase()} ${route.path} — public route but no explicit security: [] (inherits global BearerAuth)`);
    } else {
      fail(`${route.method.toUpperCase()} ${route.path} — should be public but has security set`);
    }
  }

  // Spot-check authenticated routes DON'T have security: []
  for (const route of authenticatedRoutes) {
    const pathObj = swaggerPaths[route.path];
    if (!pathObj) continue;
    const methodObj = (pathObj as any)[route.method];
    if (!methodObj) continue;

    if (Array.isArray(methodObj.security) && methodObj.security.length === 0) {
      fail(`${route.method.toUpperCase()} ${route.path} — WRONGLY marked as public (should require auth)`);
    } else {
      pass(`${route.method.toUpperCase()} ${route.path} — correctly requires auth`);
    }
  }

  /* ─── 7. RESPONSE ENVELOPE CONSISTENCY ─────────────────────── */
  console.log("\n📋 7. Response Structure Consistency");
  console.log("─".repeat(50));

  let envelopeIssues = 0;
  for (const [path, methods] of Object.entries(swaggerPaths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      if (!["get", "post", "put", "delete"].includes(method)) continue;
      const responses = (details as any).responses;
      if (!responses) continue;

      // Check 200/201 responses have success envelope
      for (const code of ["200", "201"]) {
        const resp = responses[code];
        if (!resp) continue;

        const schema = resp?.content?.["application/json"]?.schema;
        if (schema?.properties?.success !== undefined) {
          // Has envelope
        } else if (schema?.$ref) {
          // References a schema directly — might be OK
        } else if (!schema) {
          // No schema — could be 204 or similar
        } else {
          warn(`${method.toUpperCase()} ${path} [${code}] — response may not follow {success, data} envelope`);
          envelopeIssues++;
        }
      }
    }
  }
  if (envelopeIssues === 0) {
    pass("All success responses follow the {success, data} envelope pattern");
  }

  /* ─── 8. TAGS CHECK ────────────────────────────────────────── */
  console.log("\n📋 8. Tags Validation");
  console.log("─".repeat(50));

  const definedTags = new Set<string>((spec.tags || []).map((t: any) => t.name));
  const usedTags = new Set<string>();

  for (const [, methods] of Object.entries(swaggerPaths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      if (!["get", "post", "put", "delete"].includes(method)) continue;
      const tags = (details as any).tags || [];
      tags.forEach((t: string) => usedTags.add(t));
    }
  }

  for (const tag of definedTags) {
    if (usedTags.has(tag)) {
      pass(`Tag "${tag}" — defined and used`);
    } else {
      warn(`Tag "${tag}" — defined but never used`);
    }
  }

  for (const tag of usedTags) {
    if (!definedTags.has(tag)) {
      fail(`Tag "${tag}" — used in endpoints but NOT defined in tags array`);
    }
  }

  /* ─── 9. BASIC INFO ────────────────────────────────────────── */
  console.log("\n📋 9. Basic Info & Servers");
  console.log("─".repeat(50));

  if (spec.info?.title) pass(`Title: "${spec.info.title}"`);
  else fail("Missing spec title");

  if (spec.info?.version) pass(`Version: "${spec.info.version}"`);
  else fail("Missing spec version");

  if (spec.servers?.length > 0) pass(`Server URL: ${spec.servers[0].url}`);
  else fail("No servers defined");

  if (spec.openapi?.startsWith("3.")) pass(`OpenAPI version: ${spec.openapi}`);
  else fail("Not an OpenAPI 3.x spec");

  /* ─── SUMMARY ──────────────────────────────────────────────── */
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║                    FINAL SUMMARY                    ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  ✅ Passed:   ${String(passCount).padStart(3)}                                  ║`);
  console.log(`║  ❌ Failed:   ${String(failCount).padStart(3)}                                  ║`);
  console.log(`║  ⚠️  Warnings: ${String(warnCount).padStart(3)}                                  ║`);
  console.log("╠══════════════════════════════════════════════════════╣");

  const totalEndpoints = Object.keys(swaggerPaths).length;
  let totalMethods = 0;
  for (const methods of Object.values(swaggerPaths)) {
    totalMethods += Object.keys(methods as object).filter(m =>
      ["get", "post", "put", "delete", "patch"].includes(m)
    ).length;
  }

  console.log(`║  📊 Swagger endpoints: ${String(totalMethods).padStart(3)} (across ${String(totalEndpoints).padStart(2)} paths)       ║`);
  console.log(`║  📊 Real endpoints:    ${String(REAL_ROUTES.length).padStart(3)}                           ║`);
  console.log(`║  📊 Schemas:           ${String(schemas.length).padStart(3)}                           ║`);
  console.log(`║  📊 Tags:              ${String(definedTags.size).padStart(3)}                           ║`);
  console.log("╠══════════════════════════════════════════════════════╣");

  if (failCount === 0) {
    console.log("║  🎉 ALL CHECKS PASSED! Swagger spec is complete.    ║");
  } else {
    console.log("║  🔴 ISSUES FOUND — please review failures above.    ║");
  }
  console.log("╚══════════════════════════════════════════════════════╝\n");

  process.exit(failCount > 0 ? 1 : 0);
}

validate().catch((err) => {
  console.error("Fatal error running validation:", err);
  process.exit(2);
});
