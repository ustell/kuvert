// src/services/boot.ts
import { useAuth, useUsers, useItem } from '../stores';
import { useTrans } from '../stores/transfer';
import { useRoles } from '../stores/roles';
import apiClient from '../libs/apiClient';

export type BootOptions = {
  signal?: AbortSignal;
  with?: {
    me?: boolean;
    users?: boolean;
    items?: boolean;
    trans?: boolean;
  };
};

export type BootResult = {
  ok: boolean;
  errors: string[];
};

// Coalesce concurrent boots to prevent duplicate network and flicker
let inflightBoot: Promise<BootResult> | null = null;

export async function boot(opts: BootOptions = {}): Promise<BootResult> {
  if (inflightBoot) return inflightBoot;
  inflightBoot = (async () => {
  const cfg = {
    me: true,
    users: true,
    items: true,
    trans: true,
    ...(opts.with ?? {}),
  };

  // Инициализируем сторы (они уже будут привязаны к active pinia после app.use(createPinia()))
  const authStore = useAuth();
  const usersStore = useUsers();
  const itemStore = useItem();
  const transStore = useTrans();
  const rolesStore = useRoles();

  // Try bootstrap when all sections requested
  if (cfg.me && cfg.users && cfg.items && cfg.trans) {
    try {
      const res = await apiClient.getBootstrap(opts.signal);
      if (res.ok) {
        const data = (res.data as any)?.data ?? res.data ?? {};
        // auth
        if (data.me) {
          // ensure allowedTargets is available on the user object for UI components
          const at = Array.isArray(data.allowedTargets) ? data.allowedTargets : [];
          authStore.users = { ...(data.me as any), allowedTargets: at } as any;
        }
        // users
        if (Array.isArray(data.users) && data.users.length) {
          if (!(usersStore as any).isLoaded || !(usersStore as any).users?.length) {
            const u = usersStore as any;
            u.users = data.users;
            u.isLoaded = true;
            u.lastFetched = Date.now();
          }
        } else if (cfg.users && !(usersStore as any).isLoaded) {
          // bootstrap did not include users — fetch explicitly
          try { await usersStore.getUser?.(true); } catch {}
        }
        // items
        if (Array.isArray(data.items) && data.items.length) {
          if (!(itemStore as any).isLoaded || !(itemStore as any).items?.length) {
            const i = itemStore as any;
            i.items = data.items;
            i.isLoaded = true;
            i.lastFetched = Date.now();
          }
        } else if (cfg.items && !(itemStore as any).isLoaded) {
          try { await itemStore.fetchItems?.(); } catch {}
        }
        // transfers
        if (Array.isArray(data.transfers) && data.transfers.length) {
          const hasData = Array.isArray((transStore as any).transfer) && (transStore as any).transfer.length > 0;
          const scopeMine = (transStore as any)._mine;
          const isIncomingScope = scopeMine === 'to' || scopeMine == null;
          if (!hasData && isIncomingScope) {
            (transStore as any).transfer = data.transfers;
            (transStore as any).offset = data.transfers.length;
            (transStore as any).hasMore = !!data.meta?.transfersHasMore;
            (transStore as any).lastUpdatedAt = new Date();
          }
        } else if (cfg.trans && !(Array.isArray((transStore as any).transfer) && (transStore as any).transfer.length)) {
          try { await transStore.fetchItems?.(); } catch {}
        }
        // roles
        if (Array.isArray(data.roles)) {
          (rolesStore as any).roles = data.roles;
          (rolesStore as any).isLoaded = true;
        } else {
          // roles rarely change — optional load if store empty
          if (!(rolesStore as any).roles?.length) {
            try { (rolesStore as any).fetch?.(); } catch {}
          }
        }
        return { ok: true, errors: [] };
      }
    } catch (e) {
      // fallback to parallel if bootstrap failed
    }
  }

  const tasks: Promise<unknown>[] = [];

  if (cfg.me && !authStore.users) tasks.push(authStore.me?.(opts.signal) ?? Promise.resolve(true));
  if (cfg.users && !(usersStore as any).isLoaded) tasks.push(usersStore.getUser?.() ?? Promise.resolve(true));
  if (cfg.items && !(itemStore as any).isLoaded) tasks.push(itemStore.fetchItems?.(opts.signal as any) ?? Promise.resolve(true));
  if (cfg.trans && !((transStore as any).transfer && (transStore as any).transfer.length)) {
    // fix signature: fetchItems accepts an object
    tasks.push((transStore as any).fetchItems?.({ signal: opts.signal }) ?? Promise.resolve(true));
  }

  const settled = await Promise.allSettled(tasks);

  const errors: string[] = [];
  let allOk = true;

  const normalize = (value: unknown): boolean => (typeof value === 'boolean' ? value : true);

  settled.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      const ok = normalize(r.value);
      allOk = allOk && ok;
      if (!ok) errors.push(`Task#${idx} returned false`);
    } else {
      allOk = false;
      errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
    }
  });

  return { ok: allOk, errors };
  })();
  try {
    return await inflightBoot;
  } finally {
    inflightBoot = null;
  }
}
