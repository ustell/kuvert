<script setup lang="ts">
import Card from '../../components/Card.vue';
import Button from '../../components/Button.vue';
import TransferItemRow from './TransferItemRow.vue';

type Row = {
  id: string | number;
  qty: number;
  units?: number | string | null;
  item?: { name?: string | null } | null;
};

const props = defineProps<{ modelValue: Row[]; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: Row[]): void; (e: 'add-request'): void }>();

function inc(r: Row) {
  const list = [...props.modelValue];
  const i = list.findIndex((x) => x.id === r.id);
  if (i >= 0) list[i] = { ...list[i], qty: Number(list[i].qty || 0) + 1 };
  emit('update:modelValue', list);
}
function dec(r: Row) {
  const list = [...props.modelValue];
  const i = list.findIndex((x) => x.id === r.id);
  if (i < 0) return;
  const q = Number(list[i].qty || 0);
  q > 1 ? (list[i] = { ...list[i], qty: q - 1 }) : list.splice(i, 1);
  emit('update:modelValue', list);
}
const canInc = (r: Row) => Number(r.qty ?? 0);
</script>

<template>
  <Card padded>
    <div class="row-between mb-2">
      <div class="card-title">Передача</div>
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
      />
    </template>
    <div v-else class="empty">
      <div class="empty-ic">📦</div>
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
