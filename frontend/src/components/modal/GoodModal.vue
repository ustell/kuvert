<script setup lang="ts">
import {Puzzle} from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue';
import Button from '../../components/Button.vue';
import Input from '../Input.vue';
import QtyControl from '../QtyControl.vue';
import Modal from './Modal.vue';
import { useDebouncedRef } from '../../composables/useDebouncedRef';

import type { Item } from '../../types/domain';

type CompRow = { item: Item; qty: number };

const { modelValue, title, currentItem, items } = defineProps<{
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
  compMap: new Map<string, CompRow>(), // для создания
  editCompMap: new Map<string, CompRow>(), // для редактирования
});

const { raw: searchRaw, debounced: search } = useDebouncedRef('', 160);

const state = reactive({
  touched: false,
  touchedField: { sku: false, name: false } as Record<'sku' | 'name', boolean>,
  errors: { sku: '', name: '' } as Record<'sku' | 'name', string>,
});

const open = computed({
  get: () => modelValue,
  set: (v) => emit('update:modelValue', v),
});

const isEditMode = computed(() => !!currentItem);
const activeMap = computed(() => (isEditMode.value ? local.editCompMap : local.compMap));
const rows = computed<CompRow[]>(() => Array.from(activeMap.value.values()));

// SKU самого товара (нельзя выбрать как компонент)
const selfSku = computed(() => (isEditMode.value ? currentItem?.sku ?? '' : local.sku).trim());

// инициализация из currentItem
watch(
  () => currentItem,
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
      searchRaw.value = '';
    }
  },
  { immediate: true },
);

function resetLocal() {
  local.sku = '';
  local.name = '';
  searchRaw.value = '';
  local.compMap.clear();
  local.editCompMap.clear();
  state.touched = false;
  state.touchedField = { sku: false, name: false };
  state.errors = { sku: '', name: '' };
}

// при закрытии модалки сбрасываем currentItem
watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      emit('update:currentItem', null);
      // Also clear local state for create mode (when currentItem is already null)
      resetLocal();
    }
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
// helper to check if component already added
// (kept as function where needed later)
// const isAdded = (it: Item) => activeMap.value.has((it.sku ?? '').trim());

function setSku(v: string) {
  local.sku = v;
}
function setName(v: string) {
  local.name = v;
}
function setRawSearch(v: string) {
  searchRaw.value = v;
}

// кандидаты: без самого товара и без уже выбранных
const excluded = computed(() => new Set(Array.from(activeMap.value.keys())));
const candidates = computed(() => {
  const s = (search.value ?? '').toString().toLowerCase().trim();
  const self = selfSku.value;
  const list = items ?? [];
  return list
    .filter((it) => (it.sku ?? '').trim() !== self)
    .filter((it) => !excluded.value.has((it.sku ?? '').trim()))
    .filter((it) => {
      if (!s) return true;
      const name = String(it.name ?? '').toLowerCase();
      const sku = String(it.sku ?? '').toLowerCase();
      return name.includes(s) || sku.includes(s);
    });
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
  if (!validateAndFillErrors() || !currentItem) return;

  const comp = Array.from(activeMap.value.values()).map((r) => ({ sku: r.item.sku, qty: r.qty }));
  emit('update', {
    id: String(currentItem.id),
    sku: local.sku.trim(),
    name: local.name.trim(),
    comp,
  });
  emit('update:modelValue', false);
}
</script>

<template>
  <Modal v-model="open" :title="title">
    <div class="form-grid">
      <label
        class="field-col"
        :class="{ invalid: state.errors.sku && (state.touched || state.touchedField.sku) }"
      >
        <span class="field-label">Артикул</span>
        <Input
          :modelValue="local.sku"
          @update:modelValue="setSku"
          placeholder="SP-001"
          @blur="markTouched('sku'); validateAndFillErrors()"
        />
        <span class="err" v-if="state.errors.sku && (state.touched || state.touchedField.sku)">
          {{ state.errors.sku }}
        </span>
      </label>

      <label
        class="field-col"
        :class="{ invalid: state.errors.name && (state.touched || state.touchedField.name) }"
      >
        <span class="field-label">Название</span>
        <Input
          :modelValue="local.name"
          @update:modelValue="setName"
          placeholder="Samsung Galaxy S21"
          @blur="markTouched('name'); validateAndFillErrors()"
        />
        <span class="err" v-if="state.errors.name && (state.touched || state.touchedField.name)">
          {{ state.errors.name }}
        </span>
      </label>

      <div class="field-col">
        <div class="field-label">Компоненты</div>

        <div class="comp-box">
          <div class="comp-box__search">
            <Input
              :modelValue="searchRaw"
              @update:modelValue="setRawSearch"
              placeholder="Найдите компонент по названию или SKU"
              class="comp-search"
              aria-label="Поиск компонента"
            />
          </div>

          <TransitionGroup name="list" tag="div" class="chips" v-if="rows.length">
            <span class="chip flex flex-col " v-for="r in rows" :key="r.item.sku">
              <span class="chip-name" :title="r.item.name">{{ r.item.name }}</span>
              <span class="chip-qty" role="group" aria-label="Количество">
                <QtyControl
                  :value="r.qty"
                  @inc="() => inc(r.item.sku)"
                  @dec="() => dec(r.item.sku)"
                />
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
          </TransitionGroup>

          <div class="empty" v-else>
            <div class="empty-ibox"><Puzzle :size="16" color="#333333" /></div>
            <p>Выберите компоненты ниже. Минимум один компонент — необязателен, но желателен 🙂</p>
          </div>

          <div class="pool" role="listbox" aria-label="Список доступных компонентов">
            <button
              class="pill"
              type="button"
              v-for="value in candidates"
              :key="value.sku"
              @click="addItem(value)"
              :title="`${value.name} · ${value.sku}`"
            >
              <span class="pill-name">{{ value.name }}</span>
              <span class="pill-right">
                <span class="pill-sku">{{ value.sku }}</span>
                <span class="pill-plus" aria-hidden="true">＋</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-actions">
        <Button variant="soft" class="" @click="emit('update:modelValue', false)">Отменить</Button>
        <Button variant="primary" class="" :disabled="!canSubmit" @click="isEditMode ? update() : save()">
          {{ isEditMode ? '＋ Обновить' : '＋ Создать' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
