import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  envDir: '..', // resolve .env from the app root, not src/
  plugins: [react()],
  server: {
    host: true,
    port: 5177,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
  },
});
