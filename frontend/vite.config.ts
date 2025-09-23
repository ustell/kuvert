import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // port: 5173,                 // твой порт фронта
    proxy: { "/api": "http://localhost:3000" }, // vercel dev
  }
})

