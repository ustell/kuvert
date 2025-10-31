<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  items: any[];
  loading?: boolean;
  placeholder?: string;
  filterKeys?: string[];
  emptyText?: string;
}>(), {
  items: () => [],
  loading: false,
  placeholder: 'Поиск…',
  filterKeys: () => ['name', 'sku'],
  emptyText: 'Ничего не найдено',
});

const q = ref('');
const qNorm = computed(() => q.value.trim().toLowerCase());

const filtered = computed(() => {
  const list = Array.isArray(props.items) ? props.items : [];
  const s = qNorm.value;
  if (!s) return list;
  const keys = props.filterKeys || [];
  return list.filter((it) => {
    for (const k of keys) {
      const v = String((it as any)?.[k] ?? '').toLowerCase();
      if (v.includes(s)) return true;
    }
    return false;
  });
});

const emit = defineEmits<{ (e: 'update:q', v: string): void }>();
function updateQ(v: string) {
  q.value = v;
  emit('update:q', v);
}
</script>

<template>
  <div class="search-list">
    <div class="mb-3">
      <input
        class="field inp"
        type="search"
        :value="q"
        @input="(e: any) => updateQ(e?.target?.value ?? '')"
        :placeholder="placeholder"
      />
    </div>

    <slot name="loading" v-if="loading">
      <div class="muted">Загрузка…</div>
    </slot>

    <slot v-else :items="filtered">
      <div v-if="!filtered.length" class="empty">
        <div class="empty-ic">¯\\_(ツ)_/¯</div>
        <div>{{ emptyText }}</div>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.inp { width: 100%; }
</style>
