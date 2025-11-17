<script setup lang="ts">
import { ref, watch } from 'vue';
type Row = {
  id?: string | number;
  qty: number;
  units?: number | string | null;
  item?: { name?: string | null } | null;
};
const { row, canInc, disabled } = defineProps<{ row: Row; canInc: boolean; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'inc'): void; (e: 'dec'): void; (e: 'set', v: number): void }>();

const localQty = ref<string>('');
watch(
  () => row.qty,
  (nv) => {
    const s = String(nv ?? '');
    if (s !== localQty.value) localQty.value = s;
  },
  { immediate: true },
);
function onInput(e: any) {
  localQty.value = String(e?.target?.value ?? '');
}
function commitQty() {
  const n = Math.floor(Number(localQty.value));
  emit('set', Number.isFinite(n) ? n : 0);
}
</script>

<template>
  <div class="mb-3 rounded-lg border border-gray-200 bg-white p-3">
    <div class="flex items-center justify-between gap-3 flex-col">
      <div class="flex items-center gap-3 flex-col">
        <div class="text-base font-medium">{{ row.item?.name ?? '—' }}</div>
        <div class="tag" :title="`Доступно: ${Number(row.units ?? 0)}`">
          Ост:<b class="ml-1">{{ Math.max(0, Number(row.units ?? 0) - Number(row.qty ?? 0)) }}</b>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="rounded bg-gray-100 px-2 py-1" @click="emit('dec')" :disabled="!!disabled">
          −
        </button>
        <input
          type="number"
          v-model="localQty"
          class=" rounded border px-2 py-1 text-center"
          :disabled="!!disabled"
          inputmode="numeric"
          pattern="[0-9]*"
          @input="onInput"
          @blur="commitQty"
          @keydown.enter.prevent="commitQty"
        />
        <button
          class="rounded bg-gray-100 px-2 py-1"
          @click="emit('inc')"
          :disabled="!!disabled || !canInc"
          :title="!canInc ? 'Нет остатка' : ''"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag {
  inline-size: max-content;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #4b5563;
}
</style>
