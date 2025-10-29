import { useNotify } from '../stores/notify';

type Messages = {
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

    try {
      const res = await fn();

      const isOk = ok ? ok(res) : true;
      if (!isOk) {
        if (messages?.error) notify.error(messages.error);
        return res;
      }

      if (messages?.success) notify.success(messages.success);
      return res;
    } catch (e: any) {
      const msg = messages?.error || e?.message || fallbackError;
      notify.error(msg);
      throw e;
    }
  }

  return { act };
}
