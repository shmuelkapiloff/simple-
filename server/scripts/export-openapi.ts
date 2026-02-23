/**
 * Export OpenAPI specification as a static JSON file.
 *
 * Usage:
 *   npm run export-api
 *
 * Output:
 *   ./openapi.json  — ready to hand off to the frontend developer
 *
 * The frontend developer can then use this file to:
 *   - Auto-generate a TypeScript HTTP client (e.g. openapi-typescript-codegen, orval)
 *   - Import into Postman / Insomnia
 *   - Generate React Query hooks, Axios instances, etc.
 */

import fs from "fs";
import path from "path";
import { specs } from "../src/swagger";

const outputPath = path.resolve(__dirname, "..", "openapi.json");

fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2), "utf-8");

console.log(`✅ OpenAPI spec exported successfully!`);
console.log(`   📄 File: ${outputPath}`);
console.log(`   📦 Version: ${(specs as any).info?.version || "1.0.0"}`);
console.log(``);
console.log(`🔧 Frontend developer can now run:`);
console.log(
  `   npx openapi-typescript-codegen --input openapi.json --output src/api --client axios`,
);
console.log(`   — or —`);
console.log(`   npx orval --input openapi.json`);
