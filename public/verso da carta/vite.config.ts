import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/anilist': {
        target: 'https://graphql.anilist.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anilist/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('User-Agent', 'AnimePull/1.0')
          })
        }
      }
    }
  }
})