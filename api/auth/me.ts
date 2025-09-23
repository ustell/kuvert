// auth/me.ts
import type { Request, Response } from 'express'
import { getCurrentUser } from '../lib/auth'

export default async function handler(req: Request, res: Response) {
  const payload = await getCurrentUser(req)
  if (!payload) return res.status(401).json({ error: 'NO_AUTH' })
  res.json({ ok: true, auth: payload })
}
