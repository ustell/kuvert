import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma";

export default async function getUser(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
    try {
        const data = await prisma.user.findMany()
        return res.status(200).json({ data })
    } catch (error) {
        console.error(error, 'error getUser')
    }
}