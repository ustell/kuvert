<script setup lang="ts">
import Modal from './Modal.vue';
import SearchBar from '../SearchBar.vue';
import LoadingList from '../common/LoadingList.vue';
import { computed, onMounted } from 'vue';
import { useDebouncedRef } from '../../composables/useDebouncedRef';
import type { Item } from '../../types/domain';
import { useItem } from '../../stores/item';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  userInv?: any[] | undefined;
  
  items?: Item[] | undefined;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
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



const displayItems = computed(() => {
  const query = String(search.value ?? '').trim().toLowerCase();
  const inventoryMap = new Map<string | number, number>();
  const inventorySkuMap = new Map<string, number>();
  if (props.userInv?.length) {
    props.userInv.forEach(inv => {
      const qty = Number(inv?.units || 0);
      const id1 = inv?.itemId != null ? String(inv.itemId) : '';
      const id2 = inv?.item?.id != null ? String(inv.item.id) : '';
      const sku = inv?.item?.sku ? String(inv.item.sku) : '';
      if (id1) inventoryMap.set(id1, qty);
      if (id2) inventoryMap.set(id2, qty);
      if (sku) inventorySkuMap.set(sku, qty);
    });
  }
  
  
  const sourceItems = props.items?.length ? props.items : itemStore.items ?? [];
  
  
  const itemsWithQuantities = sourceItems.map(item => ({
    ...item,
    quantity:
      inventoryMap.get(String(item.id)) ??
      (item?.sku ? inventorySkuMap.get(String(item.sku)) : undefined) ??
      0,
  }));
  
  
  if (!query) return itemsWithQuantities;
  
  return itemsWithQuantities.filter(item => {
    const name = String(item.name || '').toLowerCase();
    const sku = String(item.sku || '').toLowerCase();
    const quantity = String(item.quantity || 0);
    
    return name.includes(query) || 
           sku.includes(query) || 
           quantity.includes(query);
  });
});

function getQty(it?: any): number {
  const id = String(it?.id ?? '');
  const sku = it?.sku ? String(it.sku) : '';
  if (!id && !sku) return Number(it?.quantity ?? 0) || 0;
  const inv = (props.userInv ?? []);
  let entry = inv.find(u => String(u.itemId ?? '') === id);
  if (!entry && sku) entry = inv.find(u => String(u?.item?.sku ?? '') === sku);
  return Number(entry?.units ?? it?.quantity ?? 0) || 0;
}

const onSelectItem = (item?: Item) => {
  if (!item) return;
  const asInv: Partial<any> = {
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
            <span class="chip-text">{{ it.name ?? '—' }}</span>
            <span class="quantity">({{ getQty(it) }})</span>
          </li>
        </ul>
      </div>
    </section>
  </Modal>
</template>

<style scoped>
.form {
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
  white-space: wrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
.quantity {
  color: #4b5563;
  font-size: 12px;
  margin-left: 6px;
}
</style>