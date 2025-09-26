import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma";

export default async function item(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const items = await prisma.item.findMany();
            console.log("items" + items)
            return res.status(200).json({ items });
        } catch (error) {
            console.log(error, 'error server')
        }
    }

}