import { useNotify } from '../stores/notify';

type Messages = {
  start?: string;
  success?: string;
  error?: string;
};

type Options<T> = {
  messages?: Messages;
  ok?: (result: T) => boolean;
  fallbackError?: string;
};

export function useAction() {
  const notify = useNotify();

  async function act<T>(fn: () => Promise<T>, opts: Options<T> = {}): Promise<T> {
    const { messages, ok, fallbackError } = opts;

    // if provided, show a start toast without timeout (timeout = 0 means persistent)
    let startToastId: string | null = null;
    if (messages?.start) {
      // use upsert to avoid duplicate start toasts
      // @ts-ignore - notify.upsert exists in store
      startToastId = (notify as any).upsert('info', messages.start, 0);
    }

    try {
      const res = await fn();

      const isOk = ok ? ok(res) : true;
      if (!isOk) {
        if (startToastId) notify.remove(startToastId);
        if (messages?.error) notify.error(messages.error as string);
        return res;
      }

      if (startToastId) notify.remove(startToastId);
      if (messages?.success) notify.success(messages.success as string);
      return res;
    } catch (e: any) {
      if (startToastId) notify.remove(startToastId);
      const msg = messages?.error || e?.message || fallbackError;
      if (msg) notify.error(msg as string);
      throw e;
    }
  }

  return { act };
}
