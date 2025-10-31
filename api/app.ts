// app.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import { env } from './lib/env'
import authRouter from './router/index'
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(compression())
const ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
// allow list of origins (dev + prod)
app.use(cors({ origin: ORIGINS, credentials: true }))

app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const durMs = Number((process.hrtime.bigint() - start) / 1000000n)
    if (durMs > 200) {
      const path = req.originalUrl || req.url || ''
      console.log(`${req.method} ${path} ${res.statusCode} ${durMs}ms`)
    }
  })
  next()
})

app.get('/health', (_req, res) => res.json({ ok: true }))

// роуты
app.use('/api/auth', authRouter)

export default app
