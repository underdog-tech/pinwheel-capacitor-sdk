import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  envDir: '..', // resolve .env from example-app/, not example-app/src/
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
  },
});
