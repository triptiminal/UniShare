import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies API and WebSocket calls to the Spring Boot backend (port 8080),
// so the browser only ever talks to http://localhost:5173 and CORS is never an issue.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': { target: 'http://localhost:8080', ws: true },
    },
  },
});
