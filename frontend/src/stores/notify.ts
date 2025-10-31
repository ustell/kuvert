import { defineStore } from 'pinia';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = {
  id: string;
  kind: ToastKind;
  text: string;
  timeout?: number;
};

export const useNotify = defineStore('notify', {
  state: () => ({
    toasts: [] as Toast[],
  }),
  actions: {
    push(kind: ToastKind, text: string, timeout = 2500) {
      // dedupe: if identical kind+text exists, return existing id and refresh timeout
      const existing = this.toasts.find((t) => t.kind === kind && t.text === text);
      if (existing) {
        // refresh timeout by updating the toast
        this.update(existing.id, { text, kind, timeout });
        return existing.id;
      }

      const id = Math.random().toString(36).slice(2);
      this.toasts.push({ id, kind, text, timeout });
      if (timeout > 0) {
        window.setTimeout(() => this.remove(id), timeout + 50);
      }
      return id;
    },
    success(text: string, timeout?: number) {
      return this.push('success', text, timeout);
    },
    error(text: string, timeout?: number) {
      return this.push('error', text, timeout ?? 3500);
    },
    info(text: string, timeout?: number) {
      return this.push('info', text, timeout ?? 3000);
    },
    // update an existing toast (by id) with new props
    update(id: string, patch: Partial<Toast>) {
      const i = this.toasts.findIndex((t) => t.id === id);
      if (i === -1) return false;
      this.toasts[i] = { ...this.toasts[i], ...patch } as Toast;
      // if timeout changed and is >0, reset removal timer
      const timeout = patch.timeout ?? this.toasts[i].timeout ?? 0;
      if (timeout > 0) {
        window.setTimeout(() => this.remove(id), timeout + 50);
      }
      return true;
    },
    // convenience: push or update a toast by key (kind+text) and return id
    upsert(kind: ToastKind, text: string, timeout = 2500) {
      const existing = this.toasts.find((t) => t.kind === kind && t.text === text);
      if (existing) {
        this.update(existing.id, { timeout });
        return existing.id;
      }
      return this.push(kind, text, timeout);
    },
    remove(id: string) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
    clear() {
      this.toasts = [];
    },
  },
});
