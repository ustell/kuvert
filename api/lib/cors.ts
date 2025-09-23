import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOW_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

export function applyCors(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }
    return false;
}