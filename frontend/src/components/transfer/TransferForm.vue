<script setup lang="ts">
import { computed, reactive } from 'vue';
import TransferDetailsCard from './TransferDetailsCard.vue';
import TransferItemsCard from './TransferItemsCard.vue';
import TransferModal from '../modal/TransferModal.vue';

import type { Inventory } from '../../types/domain';

type InventoryWithQty = Inventory & { qty: number };

const props = withDefaults(defineProps<{
  currentUserName?: string | null;
  allowedTargets?: Array<{ id: string | number; name: string; role?: { name?: string } | null; roleId?: string | number }>;
  disabled?: boolean;
  touched?: boolean;
  modelValue: InventoryWithQty[]; 
  toUserId: string | null;
  items?: any[] | null; 
  userInv?: Inventory[]; 
}>(), {
  allowedTargets: () => [],
  items: () => [],
  userInv: () => [],
});
console.log(props.userInv)
const emit = defineEmits<{
  (e: 'update:modelValue', v: InventoryWithQty[]): void;
  (e: 'update:toUserId', v: string | null): void;
  (e: 'openSelect'): void;
}>();

const state = reactive({ open: false });

const mv = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const toId = computed({
  get: () => props.toUserId,
  set: (v) => emit('update:toUserId', v),
});

function openSelect() {
  state.open = true;
  emit('openSelect');
}
function addSelectedItem(inv: any) {
  const selId = String(inv?.itemId ?? inv?.item?.id ?? inv?.id ?? '');
  const list = [...mv.value];
  const idx = list.findIndex((x) => String(x.itemId ?? x.item?.id ?? x.id ?? '') === selId);

  
  const unitsFromInv = (() => {
    if (inv && inv.units != null) return Number(inv.units) || 0;
    const map = new Map<string, number>((props.userInv ?? []).map((u: any) => [
      String(u.itemId ?? u.item?.id ?? u.id ?? ''),
      Number(u.units ?? 0),
    ]));
    return map.get(selId) ?? 0;
  })();

  
  const itemObj = (inv?.item ?? (inv && (inv.name || inv.sku)
    ? { id: inv.id ?? selId, name: inv.name, sku: inv.sku }
    : undefined)) as any;

  if (idx >= 0 && list[idx]) {
    const prev = list[idx];
    list[idx] = { ...prev, qty: Math.max(1, (prev.qty ?? 0) + 1) } as InventoryWithQty;
  } else {
    list.push({
      id: inv?.id,
      itemId: selId,
      item: itemObj,
      units: unitsFromInv,
      qty: 1,
    } as InventoryWithQty);
  }
  emit('update:modelValue', list as any);
}
</script>

<template>
  <div class="transfer-form">
    <TransferDetailsCard
      :current-user-name="currentUserName"
      :allowed-targets="allowedTargets || []"
      v-model="(toId as any)"
      :disabled="disabled"
      :touched="touched"
    />

    <TransferItemsCard
      v-model="(mv as any)"
      :disabled="disabled"
      @add-request="openSelect"
    />

    <TransferModal
      v-model="state.open"
      title="Проверить позиции"
      :items="items ?? []"
      :user-inv="userInv ?? []"
      @select="addSelectedItem"
    />
  </div>
</template>

<style scoped>
.transfer-form { display: grid; gap: 12px; }
</style>
