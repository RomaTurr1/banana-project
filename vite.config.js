import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://api.artic.edu',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('cookie');
            proxyReq.removeHeader('sec-fetch-dest');
            proxyReq.removeHeader('sec-fetch-mode');
            proxyReq.removeHeader('sec-fetch-site');
            proxyReq.setHeader('user-agent', 'MyExpoApp/1.0');
            proxyReq.setHeader('accept', 'application/json');
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
