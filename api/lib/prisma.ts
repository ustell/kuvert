import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: [
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
            { level: 'query', emit: 'event' },
        ],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const SLOW_MS = Number(process.env.SLOW_QUERY_MS ?? 300);
prisma.$on('query', (e: any) => {
    const d = Number(e?.duration ?? 0);
    if (d > SLOW_MS) {
        const sql: string = String(e?.query || '').replace(/\s+/g, ' ').slice(0, 500);
        const params: string = String(e?.params || '');
        const pSize = params.length;
        console.log(`prisma query ${d}ms sql="${sql}" params_len=${pSize}`);
    }
});
