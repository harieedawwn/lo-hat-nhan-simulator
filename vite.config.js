import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: ['es2020', 'safari15', 'chrome100'],
    cssTarget: ['safari15', 'chrome100'],
    assetsInlineLimit: 0,
    sourcemap: false,
    chunkSizeWarningLimit: 400,
  },
  test: { include: ['tests/**/*.test.js'] },
});
