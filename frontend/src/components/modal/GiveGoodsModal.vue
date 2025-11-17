<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import Modal from './Modal.vue';
import Button from '../Button.vue';
import Input from '../Input.vue';
import QtyControl from '../QtyControl.vue';
import type { Item, User } from '../../types/domain';
import apiClient from '../../libs/apiClient';
import InventoryBadge from '../InventoryBadge.vue';

type Row = { item: Item; qty: number };

const { modelValue, toUser, items } = defineProps<{
  modelValue: boolean;
  toUser: User | null; // кому выдаём
  items: Item[] | undefined; // каталог товаров
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'confirm', payload: { items: Array<{ itemId: string; qty: number }> }): void;
}>();

const open = computed({
  get: () => modelValue,
  set: (v) => emit('update:modelValue', v),
});

const state = reactive({
  rawSearch: '',
  search: '',
  chosen: [] as Row[],
  touched: false,
  errors: [] as string[],
  invFetched: null as Map<string, number> | null,
  invLoading: false,
});

function setRawSearch(v: string) {
  state.rawSearch = v;
}

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
  async (v) => {
    reset();
    if (v && toUser?.id) {
      // если у toUser нет инвентаря, подтянем его
      const hasPropInv = Array.isArray((toUser as any)?.inventories) && (toUser as any).inventories.length > 0;
      if (!hasPropInv) {
        state.invLoading = true;
        try {
          const res = await apiClient.getUserInventories(toUser.id);
          if (res.ok) {
            const map = new Map<string, number>();
            for (const it of res.data ?? []) {
              const key = String((it as any)?.itemId ?? (it as any)?.item?.id ?? '');
              if (key) map.set(key, Number((it as any)?.units ?? 0));
            }
            state.invFetched = map;
          }
        } finally {
          state.invLoading = false;
        }
      }
    }
  },
);

// если каталог сменился — чистим выбранное
watch(
  () => items,
  () => reset(),
);

// множества
const chosenIds = computed(() => new Set(state.chosen.map((r) => r.item.id)));

// пул доступных к добавлению
const pool = computed(() => {
  const all = items ?? [];
  const s = state.search;
  const base = all.filter((i) => !chosenIds.value.has(i.id));
  if (!s) return base;
  return base.filter(
    (i) => (i.name ?? '').toLowerCase().includes(s) || (i.sku ?? '').toLowerCase().includes(s),
  );
});

// список остатков у получателя для передачи в InventoryBadge
const invList = computed(() => {
  const inv = (toUser as any)?.inventories as Array<any> | undefined;
  if (Array.isArray(inv) && inv.length) return inv.map((x) => ({ itemId: x.itemId ?? x?.item?.id, units: Number(x.units ?? 0) }));
  if (state.invFetched) return Array.from(state.invFetched.entries()).map(([itemId, units]) => ({ itemId, units }));
  return null as any;
});

function add(item: Item) {
  if (!item?.id) return;
  if (!chosenIds.value.has(item.id)) state.chosen.push({ item, qty: 1 });
}

function setQty(row: Row, v: number) {
  const n = Math.max(0, Math.floor(Number(v) || 0));
  if (n <= 0) {
    state.chosen = state.chosen.filter((r) => r.item.id !== row.item.id);
  } else {
    row.qty = n;
  }
}

function validate(): boolean {
  const errs: string[] = [];
  if (!toUser?.id) errs.push('Получатель не выбран.');
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
      <Input
        class="search"
        :modelValue="state.rawSearch"
        @update:modelValue="setRawSearch"
        placeholder="Найти по названию или SKU"
        autofocus
      />

      <div class="picked" v-if="state.chosen.length">
        <div class="row" v-for="r in state.chosen" :key="r.item.id">
          <div class="row-name">
            {{ r.item.name ?? '—' }}
            <span class="sku">SKU: {{ r.item.sku ?? '—' }}</span>
          </div>
          <div class="qty">
           <QtyControl
  :value="r.qty"
  @update:value="(v) => setQty(r, v)"
/>
          </div>
        </div>
      </div>

      <div class="pool">
        <button class="pill" v-for="it in pool" :key="it.id" @click="add(it)">
          <span class="name">
            {{ it.name ?? '—' }}
            <InventoryBadge :itemId="it.id" :inventories="invList" />
          </span>
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
