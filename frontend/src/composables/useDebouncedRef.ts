import { ref, watch } from 'vue';

export function useDebouncedRef<T = string>(initial: T, delay = 200) {
  const raw = ref<T>(initial as T);
  const debounced = ref<T>(initial as T);

  let t: number | undefined;
  watch(raw, (v) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      debounced.value = v;
    }, delay);
  });

  return { raw, debounced };
}
