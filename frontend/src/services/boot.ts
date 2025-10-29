// src/services/boot.ts
import { useAuth, useUsers, useItem } from '../stores';
import { useTrans } from '../stores/transfer';

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

export async function boot(opts: BootOptions = {}): Promise<BootResult> {
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

  const tasks: Promise<unknown>[] = [];

  if (cfg.me) tasks.push(authStore.me?.(opts.signal) ?? Promise.resolve(true));
  if (cfg.users) tasks.push(usersStore.getUser?.() ?? Promise.resolve(true));
  if (cfg.items) tasks.push(itemStore.fetchItems?.(opts.signal) ?? Promise.resolve(true));
  if (cfg.trans) tasks.push(transStore.fetchItems?.(opts.signal) ?? Promise.resolve(true));

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
}
