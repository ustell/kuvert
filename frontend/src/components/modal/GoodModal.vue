<script setup lang="ts">
import Button from '../../components/Button.vue';
import { computed, reactive, watch } from 'vue';
import Modal from './Modal.vue';
import type { Item } from '../../types/domain';

type CompRow = { item: Item; qty: number };

const props = defineProps<{
  modelValue: boolean;
  title: string;
  currentItem: Item | null;
  items: Item[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'update:currentItem', v: Item | null): void;
  (e: 'save', payload: { sku: string; name: string; comp: Object }): void;
  (e: 'update', payload: { sku: string; name: string; comp: Object }): void;
  (e: 'close'): void;
}>();

const local = reactive<{
  sku: string;
  name: string;
  search: string;
  comp: CompRow[]; // для создания
  editComp: CompRow[]; // для редактирования
}>({
  sku: '',
  name: '',
  search: '',
  comp: [],
  editComp: [],
});

const open = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

watch(
  () => props.currentItem,
  (qwe) => {
    if (qwe) {
      // режим редактирования
      local.sku = qwe.sku;
      local.name = qwe.name;
      local.editComp = (qwe.recipesOf ?? [])
        .filter((r) => !!r.componentItem)
        .map((r) => ({ item: r.componentItem as Item, qty: r.qty ?? 1 }));
    } else {
      // режим создания
      local.sku = '';
      local.name = '';
      local.search = '';
      local.comp = [];
      local.editComp = [];
    }
  },
  { immediate: true },
);

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) emit('update:currentItem', null);
  },
);

// ---------- helpers ----------
const isEditMode = computed(() => !!props.currentItem);
const rows = computed<CompRow[]>(() => (isEditMode.value ? local.editComp : local.comp));

function addItem(it: Item) {
  const list = isEditMode.value ? local.editComp : local.comp;
  const exists = list.some((r) => r.item.sku === it.sku);
  if (!exists) list.push({ item: it, qty: 1 });
}

function removeBySku(sku: string) {
  if (isEditMode.value) {
    local.editComp = local.editComp.filter((r) => r.item.sku !== sku);
  } else {
    local.comp = local.comp.filter((r) => r.item.sku !== sku);
  }
}

function inc(sku: string) {
  const list = isEditMode.value ? local.editComp : local.comp;
  const row = list.find((r) => r.item.sku === sku);
  if (row) row.qty = (row.qty ?? 1) + 1;
}

function dec(sku: string) {
  const list = isEditMode.value ? local.editComp : local.comp;
  const row = list.find((r) => r.item.sku === sku);
  if (row) row.qty = Math.max(1, (row.qty ?? 1) - 1);
}

const filter = computed(() => {
  const s = local.search.toLowerCase().trim();
  if (!s) return props.items;
  return props.items.filter(
    (q) => q.name.toLowerCase().includes(s) || (q.sku ? q.sku.toLowerCase().includes(s) : false),
  );
});

const isAdded = (it: Item) => rows.value.some((r) => r.item.sku === it.sku);

// ---------- actions ----------
function save() {
  try {
    const comp = local.comp.map((r) => ({ sku: r.item.sku, qty: r.qty })); // ← только sku и qty
    emit('save', { sku: local.sku, name: local.name, comp });
    emit('update:modelValue', false);
  } catch (error) {
    console.error(error);
  }
}

function update() {
  try {
    if (!props.currentItem) {
      console.log('Нет товара');
      return;
    }
    // Сформировать payload для бэка
    const comp = rows.value.map((r) => ({ sku: r.item.sku, qty: r.qty })); // <-- ключевая правка

    emit('update', { sku: local.sku, name: local.name, comp });
    emit('update:modelValue', false);
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <Modal v-model="open" :title="title">
    <div class="form">
      <label class="field">
        <span style="font-size: 14px; font-weight: 600; color: #000">Артикул</span>
        <input type="text" placeholder="SP-001" v-model="local.sku" />
        <span class="Badge">Уникальный артикул</span>
      </label>

      <label class="field">
        <span style="font-size: 14px; font-weight: 600; color: #000">Название</span>
        <input type="text" placeholder="Samsung Galaxy S21" v-model="local.name" />
        <span class="Badge">Название товара</span>
      </label>

      <!-- Компоненты -->
      <div class="field">
        <div class="field-label">Компоненты</div>

        <div class="comp-box">
          <!-- Строка поиска -->
          <input
            class="comp-search"
            type="text"
            placeholder="Найдите компонент по названию или SKU"
            v-model="local.search"
          />

          <!-- Выбранные чипсы -->
          <div class="chips" v-if="rows.length">
            <span class="chip" v-for="r in rows" :key="r.item.sku">
              <span class="chip-name">{{ r.item.name }}</span>
              <span class="chip-qty">
                <button type="button" class="qty-btn" @click="dec(r.item.sku)">−</button>
                <input class="qty-input" :value="r.qty" readonly />
                <button type="button" class="qty-btn" @click="inc(r.item.sku)">+</button>
              </span>
              <button
                type="button"
                class="chip-x"
                aria-label="Удалить компонент"
                @click="removeBySku(r.item.sku)"
              >
                ✕
              </button>
            </span>
          </div>

          <!-- Пустое состояние -->
          <div class="empty" v-else>
            Выберите компоненты ниже. Минимум один компонент не обязателен, но желателен 🙂
          </div>

          <!-- Результаты поиска / все компоненты -->
          <div class="pool">
            <button
              :class="isAdded(value) ? 'visible added' : 'pill'"
              type="button"
              v-for="value in filter"
              :key="value.sku"
              :disabled="isAdded(value)"
              @click="addItem(value)"
            >
              <span class="pill-name">{{ value.name }}</span>
              <span class="pill-sku">{{ value.sku }}</span>
              <span class="pill-added" v-if="isAdded(value)">добавлен</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; gap: 8px; justify-content: flex-end">
        <Button variant="soft" class="mt12" @click="emit('update:modelValue', false)"
          >Отменить</Button
        >
        <Button variant="primary" class="mt12" @click="currentItem ? update() : save()">
          {{ currentItem ? '＋ Обновить' : '＋ Создать' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style>
.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form > .field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
.visible {
  display: none;
}
.flex {
  display: flex;
  justify-content: space-between;
}
.field {
  display: grid;
  gap: 8px;
}

.field input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  line-height: 1.2;
  color: #111827;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.field input:hover {
  border-color: #d1d5db;
}

.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background: #fff;
}

.field input::placeholder {
  color: #9ca3af;
}

.field input:disabled {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .field input {
    height: 44px;
    font-size: 15px;
  }
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}
.comp-box {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafb;
}
.comp-search {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  background: white;
}
.comp-search:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.chip {
  display: grid;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
}

.chip-name {
  font-weight: 600;
}
.chip-qty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 2px 6px;
}
.qty-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 2px 6px;
}
.qty-input {
  width: 42px;
  text-align: center;
  border: none;
  outline: none;
  background: transparent;
}
.chip-x {
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.7;
  font-size: 16px;
}
.chip-x:hover {
  opacity: 1;
}

.empty {
  color: #6b7280;
  font-size: 13px;
  padding: 4px 0 2px;
}

.pool {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, calc(100% / var(--columns))));
  gap: 8px;
  max-height: 220px;
  overflow: auto;
  padding-right: 4px;
}
.pill {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 999px;
  background: white;
  border: 1px solid #e5e7eb;
  cursor: pointer;
}
.pill[disabled] {
  opacity: 0.6;
  cursor: default;
}
.pill-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pill-sku {
  font-size: 12px;
  color: #6b7280;
}
.pill-added {
  margin-left: auto;
  font-size: 12px;
  color: #10b981;
}
</style>
