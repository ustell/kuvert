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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

app.get('/health', (_req, res) => res.json({ ok: true }))

// роуты
app.use('/api/auth', authRouter)

export default app
