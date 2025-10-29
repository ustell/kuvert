// api/auth/logout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// тот же CORS-хелпер, что и в login
function setCors(res: VercelResponse) {
  const origin = process.env.CORS_ORIGIN ?? '';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const cookieName = process.env.COOKIE_NAME || 'session';
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res.status(200).json({ ok: true });
}
