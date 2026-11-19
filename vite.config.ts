import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleRequest } from './scripts/imageDownload.ts'

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
      },
      '/api/danbooru': {
        target: 'https://danbooru.donmai.us',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/danbooru/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('User-Agent', 'AnimePull/1.0')
          })
        }
      }
    },
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/__local/images/')) {
          return next()
        }
        void handleRequest(req as any, res as any).then((handled) => {
          if (!handled && !res.headersSent) next()
        }).catch((err) => {
          console.error('Local image middleware error:', err)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ error: 'Erro interno' }))
          }
        })
      })
    }
  }
})