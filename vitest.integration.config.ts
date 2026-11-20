import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/integration/**/*.test.ts"], environment: "node", testTimeout: 60000, hookTimeout: 180000, fileParallelism: false, sequence: { concurrent: false } } });
