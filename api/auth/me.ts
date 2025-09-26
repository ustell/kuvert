import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma";
import { jwtVerify } from "jose";
import { parseCookie } from "../lib/cookies";
import { verifyToken } from "../lib/token";

export default async function handler(req: VercelRequest, res: VercelResponse) {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const cookieName = process.env.COOKIE_NAME || "session";
    const token = parseCookie(req, cookieName);
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const user = await verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    return res.status(200).json({ user });

  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
