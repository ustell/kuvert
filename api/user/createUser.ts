import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma";


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    try {
        const data = JSON.parse(req.body);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                phone: data.phone,
                password: data.password,
                createdAt: new Date(),
                isActive: true,
                role: data.role || "user"
            }
        })
        return res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
