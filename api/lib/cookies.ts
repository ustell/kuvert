import { VercelRequest } from "@vercel/node";


export function parseCookie(req: VercelRequest, name: string) {
    const header = req.headers.cookie || "";
    const cookies = Object.fromEntries(
        header.split(";").map((c) => {
            const [k, ...v] = c.trim().split("=");
            return [k, v.join("=")];
        })
    );
    return cookies[name];
}