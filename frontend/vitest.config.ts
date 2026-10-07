// Vitest config that runs TypeScript tests under src __tests__ folders.
//
// code-index:begin
// {
//  "purpose": "Vitest config that runs TypeScript tests under src __tests__ folders.",
//  "read_when": "When frontend unit tests are not being discovered or the test glob changes.",
//  "gotchas": [],
//  "keywords": ["vitest", "defineConfig", "include", "__tests__", "unit tests"],
//  "format": 1
// }
// code-index:end

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
