import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma";

export default async function user(req: VercelRequest, res: VercelResponse) {
    const { id } = req.params

    console.log('[deleteUser] method=', req.method)
    console.log('[deleteUser] originalUrl=', (req as any).originalUrl || req.url)
    console.log('[deleteUser] path=', req.path)
    console.log('[deleteUser] params=', req.params)
    console.log('[deleteUser] query=', req.query)
    if (!id || Array.isArray(id)) {
        return res.status(400).json(`Invalid user ID + ${id}`)
    }
    try {
        if (req.method === 'DELETE') {
            await prisma.user.delete({
                where: { id }
            })
            return res.status(200).json({ message: "User deleted" })
        }

        if (req.method === 'GET') {
            const user = await prisma.user.findUnique({ where: { id } })
            return res.status(200).json({ user })
        }

        return res.status(405).json({ error: "Method Not Allowed" });
    } catch (error) {
        console.error('users/[id] error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}