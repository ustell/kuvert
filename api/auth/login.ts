import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { createToken } from '../lib/token';

function setCors(res: VercelResponse) {
  const origin = process.env.CORS_ORIGIN ?? '';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  console.log('req.method', req.method);
  console.log("LOGIN");
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone, password } =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!phone || !password) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        password: true,
        isActive: true,
        inventories: {
          select: {
            id: true,
            units: true,
            item: { select: { id: true, name: true, sku: true } },
          },
        },
        role: true,
      },
    });
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev_secret');
    const days = Number(process.env.COOKIE_MAX_DAYS || '7');
    const cookieName = process.env.COOKIE_NAME || 'session';

    const token = await new SignJWT({ uid: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${days}d`)
      .sign(secret);

    const maxAge = days * 24 * 60 * 60;
    const parts = [`${cookieName}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
    parts.push(`Max-Age=${maxAge}`);
    res.setHeader('Set-Cookie', parts.join('; '));
    const softUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      inventories: Array.isArray(user.inventories)
        ? user.inventories.map((inv: any) => ({
            id: inv.id,
            units: inv.units,
            item: inv.item ? { id: inv.item.id, name: inv.item.name, sku: inv.item.sku } : null,
          }))
        : [],
    };
    const allowedTargets = user.role && String(user.role.name).toLowerCase() === 'admin' ? ['admin'] : [];
    return res.status(200).json({ token: token, user: softUser, allowedTargets });
  } catch (error: any) {
    console.error('LOGIN_ERROR', error?.message ?? error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
