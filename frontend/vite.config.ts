import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Forward every backend /auth/* endpoint (register, login, me,
      // forgot-password, google/microsoft/apple OAuth, etc.) to FastAPI.
      // IMPORTANT: /auth/callback is the React Router page that receives the
      // OAuth redirect — it must stay on the frontend, so it's excluded via
      // `bypass` rather than being carved out with a narrower prefix.
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.url && req.url.startsWith('/auth/callback')) {
            return req.url; // tells Vite to serve this locally, not proxy it
          }
        },
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});