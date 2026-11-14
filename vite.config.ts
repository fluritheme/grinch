import { defineConfig } from 'vite';
export default defineConfig({
  root: 'demo',
  optimizeDeps: { noDiscovery: true },
  build: { outDir: '../site-dist', emptyOutDir: true },
  server: { fs: { allow: ['..'] } },
});
