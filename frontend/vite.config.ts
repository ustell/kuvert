import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Kuvert',
        short_name: 'Kuvert',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          // Replace with real PNG icons (192x192, 512x512) under public/icons
          { src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/vite.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
        display_override: ['standalone', 'minimal-ui'],
      },
      workbox: {
        navigateFallback: '/',
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    }, // vercel dev
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
