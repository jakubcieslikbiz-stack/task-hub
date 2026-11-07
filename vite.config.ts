import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import https from 'node:https'

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
            req.on('end', () => {
              try {
                const body = JSON.parse(bodyStr || '{}')
                const { to, subject, html, apiKey } = body
                const postData = JSON.stringify({
                  from: 'TaskHub <onboarding@resend.dev>',
                  to: Array.isArray(to) ? to : [to],
                  subject,
                  html,
                })

                const resendReq = https.request(
                  'https://api.resend.com/emails',
                  {
                    method: 'POST',
                    rejectUnauthorized: false,
                    headers: {
                      Authorization: `Bearer ${(apiKey || '').trim()}`,
                      'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(postData),
                    },
                  },
                  (resendRes) => {
                    let out = ''
                    resendRes.on('data', (c) => (out += c))
                    resendRes.on('end', () => {
                      res.statusCode = resendRes.statusCode || 200
                      res.setHeader('Content-Type', 'application/json')
                      res.end(out)
                    })
                  }
                )

                resendReq.on('error', (err) => {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                })

                resendReq.write(postData)
                resendReq.end()
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

