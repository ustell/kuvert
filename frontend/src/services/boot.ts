// src/services/boot.ts
import { pinia } from '../stores/pinia';
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

  // Получаем экземпляры стора вне setup: передаём pinia вручную
  const authStore = useAuth();
  const usersStore = useUsers();
  const itemStore = useItem();
  const itemTrans = useTrans();

  const tasks: Promise<any>[] = [];

  if (cfg.me) {
    tasks.push(authStore.me?.(opts.signal) ?? Promise.resolve(true));
  }
  if (cfg.users) {
    tasks.push(usersStore.getUser?.() ?? Promise.resolve(true));
  }
  if (cfg.items) {
    tasks.push(itemStore.fetchItems?.(opts.signal) ?? Promise.resolve(true));
  }
  if (cfg.trans) {
    tasks.push(itemTrans.fetchItems?.(opts.signal) ?? Promise.resolve(true));
  }

  const results = await Promise.allSettled(tasks);

  const errors: string[] = [];
  let allOk = true;
  let idx = 0;

  function normalize(value: any): boolean {
    if (typeof value === 'boolean') return value;
    return true;
  }

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const ok = normalize(r.value);
      allOk = allOk && ok;
      if (!ok) errors.push(`Task#${idx} returned false`);
    } else {
      allOk = false;
      errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
    }
    idx++;
  }

  return { ok: allOk, errors };
}
