<script setup lang="ts">
import { computed } from 'vue';
import { useAuth } from '../stores/auth';
import type { Inventory, User } from '../types/domain';

const props = withDefaults(defineProps<{
  userId?: string | number | null;
  itemId?: string | number | null;
  inventories?: Array<Pick<Inventory, 'itemId' | 'units'>> | null;
  showZero?: boolean;
  prefix?: string;
  suffix?: string;
}>(), {
  inventories: null,
  showZero: true,
  prefix: ' (',
  suffix: ')',
});

const auth = useAuth();

const count = computed<number | null>(() => {
  const iid = props.itemId != null ? String(props.itemId) : '';
  if (!iid) return null;

  // 1) use explicit inventories when provided
  const list = props.inventories;
  if (Array.isArray(list)) {
    const found = list.find((r: any) => String(r?.itemId ?? r?.item?.id) === iid);
    return Number(found?.units ?? 0);
  }

  // 2) fallback to current user when IDs match
  const uid = props.userId != null ? String(props.userId) : '';
  const me = auth.users as unknown as (User & { inventories?: Array<Pick<Inventory, 'itemId' | 'units'>> }) | null;
  if (me && uid && String(me.id) === uid) {
    const found = (me.inventories ?? []).find((r: any) => String(r?.itemId ?? r?.item?.id) === iid);
    return Number(found?.units ?? 0);
  }

  return null;
});
</script>

<template>
  <span v-if="count !== null && (showZero || count > 0)" class="inv-badge">{{ prefix }}{{ count }}{{ suffix }}</span>
</template>

<style scoped>
.inv-badge { opacity: .85; }
</style>
