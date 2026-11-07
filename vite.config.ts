import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-send-email',
      configureServer(server) {
        server.middlewares.use('/api/send-email', (req, res) => {
          if (req.method === 'POST') {
            let bodyStr = ''
            req.on('data', (chunk) => {
              bodyStr += chunk
            })
            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr || '{}')
                const { to, subject, html, apiKey } = body
                const resendRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${(apiKey || '').trim()}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'TaskHub <onboarding@resend.dev>',
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    html,
                  }),
                })
                const data = await resendRes.text()
                res.statusCode = resendRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(data)
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          } else {
            res.statusCode = 200
            res.end()
          }
        })
      },
    },
  ],
  server: {
    host: true, // Listen on all network addresses (accessible via Wi-Fi from phone)
    port: 5173,
  },
})

