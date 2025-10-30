<script setup lang="ts">
import Modal from './Modal.vue';
import SearchBar from '../SearchBar.vue';
import LoadingList from '../common/LoadingList.vue';
import { computed, onMounted } from 'vue';
import { useDebouncedRef } from '../../composables/useDebouncedRef';
import type { Inventory, Item } from '../../types/domain';
import { useItem } from '../../stores/item';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  userInv?: Inventory[] | undefined;
  // optional explicit items list (global catalog). If provided, modal shows these items.
  items?: Item[] | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  // emit any — we may emit an inventory-like object constructed from an Item
  (e: 'select', v: any): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: () => emit('update:modelValue', false),
});

const { raw: rawSearch, debounced: search } = useDebouncedRef('', 200);

const itemStore = useItem();
onMounted(() => {
  if (!itemStore.isLoaded) itemStore.fetchItems().catch(() => {});
});

// produce a list of Item objects to render: prefer explicit props.items, then global store items,
// finally fall back to mapping user inventory -> their .item
const displayItems = computed(() => {
  const q = String(search.value ?? '')
    .toLowerCase()
    .trim();
  const source: Item[] = (props.items && props.items.length ? props.items : itemStore.items) ?? [];
  // if no global items available, try mapping from userInv
  if (!source.length && props.userInv && props.userInv.length) {
    const mapped = props.userInv.map((inv) => inv.item).filter(Boolean) as Item[];
    if (!q) return mapped;
    return mapped.filter((it) => {
      const name = String(it.name ?? '').toLowerCase();
      const sku = String((it as any).sku ?? '').toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }

  if (!q) return source;
  return source.filter((it) => {
    const name = String(it.name ?? '').toLowerCase();
    const sku = String((it as any).sku ?? '').toLowerCase();
    return name.includes(q) || sku.includes(q);
  });
});

const onSelectItem = (item?: Item) => {
  if (!item) return;
  // emit a lightweight inventory-like object so parent handlers that expect Inventory still work
  const asInv: Partial<Inventory> = {
    id: undefined,
    itemId: String(item.id ?? ''),
    item: item as any,
  };
  emit('select', asInv);
  emit('update:modelValue', false);
};
</script>

<template>
  <Modal
    v-model="open"
    :title="title"
    aria-labelledby="items-modal-title"
    aria-describedby="items-modal-desc"
  >
    <section class="form">
      <div class="mb-3">
        <SearchBar
          v-model:raw="rawSearch"
          v-model:debounced="search"
          placeholder="Поиск по названию или SKU"
          :debounceMs="200"
        />
      </div>
      <div>
        <LoadingList v-if="itemStore.loading && !displayItems.length" :rows="5" />
        <ul v-else class="chips" role="list">
          <li
            v-for="(it, i) in displayItems"
            :key="it.id ?? i"
            class="chip"
            :title="it.name"
            @click="onSelectItem(it)"
          >
            <span class="chip-dot" aria-hidden="true"></span>
            <span class="chip-text">{{ it.name ?? '—' }}</span>
          </li>
        </ul>
      </div>
    </section>
  </Modal>
</template>

<style scoped>
.form {
  padding: 12px 20px 4px;
  max-height: min(48vh, 420px);
  overflow: auto;
}
.chips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}
.chip:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}
.chip-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
</style>
