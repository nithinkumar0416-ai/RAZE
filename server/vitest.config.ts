import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['src/demo-repo/**', 'node_modules/**', 'dist/**']
  }
});
