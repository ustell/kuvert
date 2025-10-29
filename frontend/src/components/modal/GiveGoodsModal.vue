<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import Modal from './Modal.vue';
import Button from '../Button.vue';
import type { Item, User } from '../../types/domain';

type Row = { item: Item; qty: number };

const props = defineProps<{
  modelValue: boolean;
  toUser: User | null; // кому выдаём
  items: Item[] | undefined; // каталог товаров
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'confirm', payload: { items: Array<{ itemId: string; qty: number }> }): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const state = reactive({
  rawSearch: '',
  search: '',
  chosen: [] as Row[],
  touched: false,
  errors: [] as string[],
});

// плавный UX: лёгкий дебаунс поиска
let t: number | undefined;
watch(
  () => state.rawSearch,
  (v) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      state.search = v.trim().toLowerCase();
    }, 180);
  },
);

// reset helper
function reset() {
  state.rawSearch = '';
  state.search = '';
  state.chosen = [];
  state.touched = false;
  state.errors = [];
}

// сброс при открытии/закрытии
watch(
  () => open.value,
  () => reset(),
);

// если каталог сменился — чистим выбранное
watch(
  () => props.items,
  () => reset(),
);

// множества
const chosenIds = computed(() => new Set(state.chosen.map((r) => r.item.id)));

// пул доступных к добавлению
const pool = computed(() => {
  const all = props.items ?? [];
  const s = state.search;
  const base = all.filter((i) => !chosenIds.value.has(i.id));
  if (!s) return base;
  return base.filter(
    (i) => (i.name ?? '').toLowerCase().includes(s) || (i.sku ?? '').toLowerCase().includes(s),
  );
});

function add(item: Item) {
  if (!item?.id) return;
  if (!chosenIds.value.has(item.id)) state.chosen.push({ item, qty: 1 });
}
function inc(row: Row) {
  row.qty = Math.max(1, (row.qty ?? 1) + 1);
}
function dec(row: Row) {
  if ((row.qty ?? 1) > 1) row.qty--;
  else state.chosen = state.chosen.filter((r) => r.item.id !== row.item.id);
}

function validate(): boolean {
  const errs: string[] = [];
  if (!props.toUser?.id) errs.push('Получатель не выбран.');
  if (state.chosen.length === 0) errs.push('Добавьте хотя бы одну позицию.');
  state.errors = Array.from(new Set(errs));
  return state.errors.length === 0;
}

function confirm() {
  state.touched = true;
  if (!validate()) return;

  const items = state.chosen.map((r) => ({ itemId: r.item.id, qty: Math.max(1, r.qty) }));
  emit('confirm', { items });

  // закрываем и сразу чистим форму
  emit('update:modelValue', false);
  reset();
}
</script>

<template>
  <Modal v-model="open" :title="`Выдать товары ${toUser?.name ? '→ ' + toUser.name : ''}`">
    <div class="box">
      <input
        class="search"
        type="text"
        placeholder="Найти по названию или SKU"
        v-model="state.rawSearch"
        autofocus
      />

      <div class="picked" v-if="state.chosen.length">
        <div class="row" v-for="r in state.chosen" :key="r.item.id">
          <div class="row-name">
            {{ r.item.name ?? '—' }}
            <span class="sku">SKU: {{ r.item.sku ?? '—' }}</span>
          </div>
          <div class="qty">
            <button class="btn" @click="dec(r)">−</button>
            <input class="qty-inp" :value="r.qty" readonly />
            <button class="btn" @click="inc(r)">+</button>
          </div>
        </div>
      </div>

      <div class="pool">
        <button class="pill" v-for="it in pool" :key="it.id" @click="add(it)">
          <span class="name">{{ it.name ?? '—' }}</span>
          <span class="sku">{{ it.sku ?? '—' }}</span>
        </button>
      </div>

      <div v-if="state.touched && state.errors.length" class="errors">
        <ul>
          <li v-for="e in state.errors" :key="e">{{ e }}</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="ftr">
        <Button variant="soft" @click="open = false">Отменить</Button>
        <Button variant="danger" @click="confirm">✓ Выдать</Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.box {
  display: grid;
  gap: 12px;
}
.search {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 12px;
}
.picked {
  display: grid;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
}
.row-name {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.sku {
  font-size: 12px;
  color: #6b7280;
}
.qty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn {
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
}
.qty-inp {
  width: 42px;
  text-align: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.pool {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
}
.name {
  font-weight: 600;
}
.ftr {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.errors {
  margin-top: 6px;
  padding: 8px 10px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
  border-radius: 8px;
}
</style>
