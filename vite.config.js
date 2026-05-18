import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer'
  },
  server: {
    port: 3000  // 统一端口，与生产环境一致，共享 localStorage
  }
});
