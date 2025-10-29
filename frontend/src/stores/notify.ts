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
    remove(id: string) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
    clear() {
      this.toasts = [];
    },
  },
});
