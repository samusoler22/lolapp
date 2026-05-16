import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/stats': {
        target: 'https://lolalytics.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stats/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'LoLChampionExplorer/1.0 (personal project)')
          })
        },
      },
    },
  },
})
