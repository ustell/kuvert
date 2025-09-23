// lib/auth.ts
import type { Request } from 'express'
import { env } from './env'
import { verify } from './jwt'

export function readAuthToken(req: Request): string | null {
  // 1) Authorization: Bearer <token>
  const auth = req.get('authorization') || req.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()

  // 2) Cookie: auth=<token>
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const pair = cookieHeader
      .split(';')
      .map(s => s.trim())
      .find(s => s.startsWith(`${env.COOKIE_NAME}=`))
    if (pair) return decodeURIComponent(pair.split('=')[1])
  }
  return null
}

export async function getCurrentUser(req: Request) {
  const token = readAuthToken(req)
  if (!token) return null
  try {
    // payload: { userId, roleId, iat, exp }
    return await verify(token)
  } catch {
    return null
  }
}
