import { jwtVerify, SignJWT, type JWTPayload } from "jose";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { createToken } from "../lib/token";

// CORS helper (для dev, когда фронт на другом порту)
function setCors(res: VercelResponse) {
  const origin = process.env.CORS_ORIGIN ?? "";
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { phone, password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    if (!phone || !password) {
      return res.status(401).json({ error: "Неверные учетные данные" });
    }
    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, name: true, phone: true, password: true, isActive: true, inventories: true } })
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: "Неверные учетные данные" });
    }

    const hash = bcrypt.compare(password, user.password);
    if (!hash) {
      return res.status(401).json({ error: "Неверные учетные данные" });
    }
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "");
    const days = Number(process.env.COOKIE_MAX_DAYS || "7");
    const cookieName = process.env.COOKIE_NAME || "session";

    const token = await new SignJWT({ uid: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${days}d`)
      .sign(secret);

    const maxAge = days * 24 * 60 * 60;
    const parts = [
      `${cookieName}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
    ];
    parts.push(`Max-Age=${maxAge}`);
    res.setHeader("Set-Cookie", parts.join("; "));
    const softUser = {
      name: user.name,
      phone: user.phone,
      id: user.id
    }
    console.log(user)
    return res.status(200).json({ token: token, user: softUser });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
