import { ref } from 'vue';

export function useBusySet() {
  const set = ref(new Set<string>());
  const has = (id: string) => set.value.has(id);
  const start = (id: string) => {
    const s = new Set(set.value);
    s.add(id);
    set.value = s;
  };
  const stop = (id: string) => {
    const s = new Set(set.value);
    s.delete(id);
    set.value = s;
  };
  const wrap = async <T>(id: string, task: () => Promise<T>) => {
    start(id);
    try {
      return await task();
    } finally {
      stop(id);
    }
  };
  return { has, start, stop, wrap };
}
