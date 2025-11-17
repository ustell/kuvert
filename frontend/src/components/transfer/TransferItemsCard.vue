<script setup lang="ts">
import {Package} from 'lucide-vue-next';
import Card from '../../components/Card.vue';
import Button from '../../components/Button.vue';
import TransferItemRow from './TransferItemRow.vue';

type Row = {
  id?: string | number;
  qty: number;
  units?: number | string | null;
  item?: { name?: string | null } | null;
};

const { modelValue, disabled } = defineProps<{ modelValue: Row[]; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: Row[]): void; (e: 'add-request'): void }>();

function findIndexByRow(list: Row[], r: Row) {
  return list.findIndex((x) => {
    // prefer explicit id matching
    if (x.id !== undefined && r.id !== undefined) return String(x.id) === String(r.id);
    // try matching nested item ids if present
    const xi = (x as any).item?.id ?? (x as any).itemId ?? (x as any).item?.itemId;
    const ri = (r as any).item?.id ?? (r as any).itemId ?? (r as any).item?.itemId;
    if (xi !== undefined && ri !== undefined) return String(xi) === String(ri);
    // fallback to reference equality
    return x === r;
  });
}

function inc(r: Row) {
  const list = [...modelValue];
  const i = findIndexByRow(list, r);
  if (i >= 0) {
    const prev = list[i]!;
    list[i] = { ...prev, qty: Number(prev.qty || 0) + 1 } as Row;
  } else {
    // if not present, append a copy with qty 1 (or increment existing qty field)
    list.push({ ...(r as Row), qty: Number(r.qty || 0) + 1 });
  }
  emit('update:modelValue', list);
}

function dec(r: Row) {
  const list = [...modelValue];
  const i = findIndexByRow(list, r);
  if (i < 0) return;
  const prev = list[i]!;
  const q = Number(prev.qty ?? 0);
  if (q > 0) list[i] = { ...prev, qty: q - 1 } as Row;
  else list.splice(i, 1);
  emit('update:modelValue', list);
}

function setQty(r: Row, v: number) {
  const list = [...modelValue];
  const i = findIndexByRow(list, r);
  const nextQty = Math.max(1, Math.floor(Number(v) || 0));
  if (i >= 0) list[i] = { ...list[i]!, qty: nextQty } as Row;
  else list.push({ ...(r as Row), qty: nextQty });
  emit('update:modelValue', list);
}

const canInc = (r: Row) => Number(r.qty ?? 0) > 0;
</script>

<template>
  <Card padded>
    <div class="row-between mb-2">
      <Button variant="soft" @click="emit('add-request')" :disabled="!!disabled"
        >＋ Добавить товар</Button
      >
    </div>

    <template v-if="modelValue.length">
      <TransferItemRow
        v-for="r in modelValue"
        :key="r.id"
        :row="r"
        :canInc="canInc(r)"
        :disabled="!!disabled"
        @inc="inc(r)"
        @dec="dec(r)"
        @set="(v) => setQty(r, v)"
      />
    </template>
    <div v-else class="empty">
      <div class="empty-ic"><Package :size="16" color="#333333" /></div>
      <div>Нет добавленных товаров</div>
      <div class="small">Нажмите "Добавить товар", чтобы начать</div>
    </div>
  </Card>
</template>

<style scoped>
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.empty {
  text-align: center;
  color: #6b7280;
  padding: 16px 8px;
}
.empty-ic {
  font-size: 28px;
  margin-bottom: 6px;
}
.small {
  font-size: 12px;
}
</style>
