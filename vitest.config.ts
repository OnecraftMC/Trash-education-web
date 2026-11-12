import { defineConfig } from "vitest/config";

// Only the Vitest suites; the Node built-in characterization suite
// (tests/legacy-contract.test.cjs) runs separately via `npm test`.
export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        // Provides requestAnimationFrame, which the scroll handlers use.
        pretendToBeVisual: true,
      },
    },
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
  },
});
