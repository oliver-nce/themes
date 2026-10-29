// Vitest config that runs TypeScript tests under src __tests__ folders.
//

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
