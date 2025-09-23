import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../lib/env";
import { sign } from "../lib/jwt";

const prisma = new PrismaClient();
const LoginDto = z.object({
  phone: z.string().min(3),
  password: z.string().min(1),
});

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST")
      return res.status(405).send("METHOD_NOT_ALLOWED");

    // body может прийти строкой
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const data = LoginDto.parse(body);

    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
      include: { role: true },
    });
    if (!user || !user.isActive)
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const okPwd = await bcrypt.compare(data.password, user.password);
    if (!okPwd) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const token = await sign(
      { userId: user.id, roleId: user.roleId },
      Number(env.COOKIE_MAX_DAYS)
    );
    const maxAge = Number(env.COOKIE_MAX_DAYS) * 24 * 60 * 60;

    res.setHeader(
      "Set-Cookie",
      `${env.COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Secure`
    );

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role ? { id: user.role.id, name: user.role.name } : null,
        createdAt: user.createdAt,
        isActive: user.isActive,
      },
    });
  } catch (e: any) {
    console.error("LOGIN_ERROR:", e);
    res.status(500).json({ error: "INTERNAL" });
  }
}
