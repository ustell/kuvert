<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import Button from '../../components/Button.vue';
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
  (e: 'save', p: { sku: string; name: string; comp: Array<{ sku: string; qty: number }> }): void;
  (
    e: 'update',
    p: { id: string; sku: string; name: string; comp: Array<{ sku: string; qty: number }> },
  ): void;
}>();

const local = reactive({
  sku: '',
  name: '',
  rawSearch: '',
  search: '',
  compMap: new Map<string, CompRow>(), // для создания
  editCompMap: new Map<string, CompRow>(), // для редактирования
});

const state = reactive({
  touched: false,
  touchedField: { sku: false, name: false } as Record<'sku' | 'name', boolean>,
  errors: { sku: '', name: '' } as Record<'sku' | 'name', string>,
});

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const isEditMode = computed(() => !!props.currentItem);
const activeMap = computed(() => (isEditMode.value ? local.editCompMap : local.compMap));
const rows = computed<CompRow[]>(() => Array.from(activeMap.value.values()));

// SKU самого товара (нельзя выбрать как компонент)
const selfSku = computed(() =>
  (isEditMode.value ? props.currentItem?.sku ?? '' : local.sku).trim(),
);

// инициализация из currentItem
watch(
  () => props.currentItem,
  (it) => {
    local.compMap.clear();
    local.editCompMap.clear();
    state.touched = false;
    state.touchedField = { sku: false, name: false };
    state.errors = { sku: '', name: '' };

    if (it) {
      local.sku = it.sku ?? '';
      local.name = it.name ?? '';
      for (const r of it.recipesOf ?? []) {
        const comp = r.componentItem as Item | undefined;
        if (!comp?.sku) continue;
        const sku = comp.sku.trim();
        local.editCompMap.set(sku, { item: comp, qty: Math.max(1, r.qty ?? 1) });
      }
    } else {
      local.sku = '';
      local.name = '';
      local.rawSearch = '';
      local.search = '';
    }
  },
  { immediate: true },
);

// при закрытии модалки сбрасываем currentItem
watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) emit('update:currentItem', null);
  },
);

// дебаунс поиска по компонентам
let t: number | undefined;
watch(
  () => local.rawSearch,
  (v) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      local.search = (v ?? '').toString().toLowerCase().trim();
    }, 160);
  },
);

// helpers
function addItem(it: Item) {
  const sku = (it.sku ?? '').trim();
  if (!sku) return;
  const ex = activeMap.value.get(sku);
  if (ex) ex.qty = Math.max(1, (ex.qty ?? 1) + 1);
  else activeMap.value.set(sku, { item: it, qty: 1 });
}
function inc(sku: string) {
  const k = (sku ?? '').trim();
  const row = activeMap.value.get(k);
  if (row) row.qty = Math.max(1, (row.qty ?? 1) + 1);
}
function dec(sku: string) {
  const k = (sku ?? '').trim();
  const row = activeMap.value.get(k);
  if (!row) return;
  if ((row.qty ?? 1) > 1) row.qty--;
  else activeMap.value.delete(k);
}
function removeBySku(sku: string) {
  activeMap.value.delete((sku ?? '').trim());
}
const isAdded = (it: Item) => activeMap.value.has((it.sku ?? '').trim());

// кандидаты: без самого товара и без уже выбранных
const candidates = computed(() => {
  const s = local.search;
  const list = props.items ?? [];
  return list
    .filter((it) => (it.sku ?? '').trim() !== selfSku.value)
    .filter((it) => !activeMap.value.has((it.sku ?? '').trim()))
    .filter(
      (it) =>
        !s || (it.name ?? '').toLowerCase().includes(s) || (it.sku ?? '').toLowerCase().includes(s),
    );
});

// валидация (без сайд-эффектов)
const validSku = computed(() => !!local.sku.trim());
const validName = computed(() => !!local.name.trim());
const canSubmit = computed(() => validSku.value && validName.value);

// ошибки заполняем только при блюре/сабмите
function validateAndFillErrors() {
  state.errors = {
    sku: validSku.value ? '' : 'Введите артикул',
    name: validName.value ? '' : 'Введите название',
  };
  return !state.errors.sku && !state.errors.name;
}
function markTouched(field?: 'sku' | 'name') {
  if (field) state.touchedField[field] = true;
  state.touched = true;
}

// actions
function save() {
  state.touched = true;
  markTouched();
  if (!validateAndFillErrors()) return;

  const comp = Array.from(local.compMap.values()).map((r) => ({ sku: r.item.sku, qty: r.qty }));
  emit('save', { sku: local.sku.trim(), name: local.name.trim(), comp });
  emit('update:modelValue', false);
}
function update() {
  state.touched = true;
  markTouched();
  if (!validateAndFillErrors() || !props.currentItem) return;

  const comp = Array.from(activeMap.value.values()).map((r) => ({ sku: r.item.sku, qty: r.qty }));
  emit('update', {
    id: String(props.currentItem.id),
    sku: local.sku.trim(),
    name: local.name.trim(),
    comp,
  });
  emit('update:modelValue', false);
}
</script>

<template>
  <Modal v-model="open" :title="title">
    <div class="form">
      <label
        class="field"
        :class="{ invalid: state.errors.sku && (state.touched || state.touchedField.sku) }"
      >
        <span class="field-label">Артикул</span>
        <input
          type="text"
          placeholder="SP-001"
          v-model="local.sku"
          @blur="
            markTouched('sku');
            validateAndFillErrors();
          "
        />
        <span class="err" v-if="state.errors.sku && (state.touched || state.touchedField.sku)">
          {{ state.errors.sku }}
        </span>
      </label>

      <label
        class="field"
        :class="{ invalid: state.errors.name && (state.touched || state.touchedField.name) }"
      >
        <span class="field-label">Название</span>
        <input
          type="text"
          placeholder="Samsung Galaxy S21"
          v-model="local.name"
          @blur="
            markTouched('name');
            validateAndFillErrors();
          "
        />
        <span class="err" v-if="state.errors.name && (state.touched || state.touchedField.name)">
          {{ state.errors.name }}
        </span>
      </label>

      <div class="field">
        <div class="field-label">Компоненты</div>
        <div class="comp-box">
          <input
            class="comp-search"
            type="text"
            placeholder="Найдите компонент по названию или SKU"
            v-model="local.rawSearch"
          />

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
                aria-label="Удалить"
                @click="removeBySku(r.item.sku)"
              >
                ✕
              </button>
            </span>
          </div>
          <div class="empty" v-else>
            <p class="p-3">
              Выберите компоненты ниже. Минимум один компонент не обязателен, но желателен 🙂
            </p>
          </div>

          <div class="pool">
            <button
              class="pill"
              type="button"
              v-for="value in candidates"
              :key="value.sku"
              @click="addItem(value)"
            >
              <span class="pill-name">{{ value.name }}</span>
              <span class="pill-sku">{{ value.sku }}</span>
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
        <Button
          variant="primary"
          class="mt12"
          :disabled="!canSubmit"
          @click="isEditMode ? update() : save()"
        >
          {{ isEditMode ? '＋ Обновить' : '＋ Создать' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.field {
  display: grid;
  gap: 8px;
}
.field.invalid input {
  border-color: #fecaca;
  background: #fff1f2;
}
.err {
  color: #b91c1c;
  font-size: 12px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}
.field input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.field input:hover {
  border-color: #d1d5db;
}
.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.field input::placeholder {
  color: #9ca3af;
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
  background: #fff;
  outline: none;
}
.comp-search:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.chips {
  display: grid;
  gap: 8px;
}
.chip {
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  width: max-content;
}
.chip-name {
  font-weight: 600;
}
.chip-qty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
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

/* 🔧 микро-адаптация для очень узких экранов */
@media (max-width: 360px) {
  .form {
    gap: 12px;
    overflow-x: hidden;
  }

  .field input {
    height: 36px;
  }

  .comp-box {
    padding: 8px;
  }

  /* выбранные компоненты: делаем на всю ширину */
  .chips {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .chip {
    /* было: width: max-content; grid-раскладка */
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 6px;
    padding: 6px 8px;
  }
  .chip-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-qty {
    gap: 4px;
    padding: 2px 4px;
  }
  .qty-input {
  } /* было 42px */
  .qty-btn {
    padding: 0 4px;
    font-size: 15px;
  }

  /* сетка кандидатов: одна колонка, без горизонтального скролла */
  .pool {
    grid-template-columns: 1fr; /* было: repeat(auto-fill, minmax(180px, 1fr)) */
    max-height: 180px;
    padding-right: 0;
  }
  .pill {
    padding: 6px 8px;
  }
  .pill-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pill-sku {
    font-size: 11px;
  }

  /* чуть компактнее общие отступы/радиусы */
  .field input,
  .comp-search {
    border-radius: 8px;
  }
}

/* 💡 немного универсального — полезно и без медиазапроса */
.chip-x {
  flex: 0 0 auto;
}
.chip-qty {
  flex: 0 0 auto;
}
</style>
