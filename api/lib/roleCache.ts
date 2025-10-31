import { prisma } from './prisma';

type Cached = {
  role: any | null;
  recipients: any[];
  expires: number;
};

const cache = new Map<string, Cached>();
const TTL_MS = 30 * 1000; // 30 seconds

/**
 * Return role and allowed recipient users for a given roleId.
 * Results are cached for TTL_MS to avoid repeated heavy queries on /api/auth/me.
 */
export async function getRoleWithRecipients(roleId: string | null) {
  if (!roleId) return { role: null, recipients: [] };
  const now = Date.now();
  const existing = cache.get(roleId);
  if (existing && existing.expires > now) {
    return { role: existing.role, recipients: existing.recipients };
  }

  // fetch role with fromRules and recipients if any
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true, name: true, fromRules: { select: { toRoleId: true } } },
  });

  let recipients: any[] = [];
  const allowedRoleIds = (role?.fromRules ?? []).map((r: any) => r.toRoleId).filter(Boolean);
  if (allowedRoleIds.length) {
    recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: undefined },
        roleId: { in: allowedRoleIds },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        roleId: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  cache.set(roleId, { role, recipients, expires: now + TTL_MS });
  return { role, recipients };
}

export function clearRoleCache(roleId?: string) {
  if (roleId) cache.delete(roleId);
  else cache.clear();
}
