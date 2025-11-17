<!-- pages/transfers/index.vue -->
<script setup lang="ts">
import RowCard from '../../components/RowCard.vue';
import ToolbarSearchStatus from '../../components/list/ToolbarSearchStatus.vue';
import LoadingList from '../../components/common/LoadingList.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import { onMounted, computed, ref, watch, reactive } from 'vue';
import { useTrans } from '../../stores/transfer';
import type { Transaction } from '../../types/domain';
import { useFormat } from '../../composables/useFormat';
import { useInventory } from '../../stores/inventory';

const trans = useTrans();
const fmt = useFormat('ru-RU');
const inventory = useInventory();

const refresh = async () => {
  await trans.fetchItems({
    reset: true,
    status: status.value,
    q: rawSearch.value,
    toUserId: undefined,
    fromUserId: undefined,
    userId: undefined,
    mine: undefined,
  });
};

onMounted(refresh);

const rawSearch = ref(''); // интерфейс оставили, но бэкенд не фильтрует
type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';
const status = ref<StatusFilter>('all');

const items = computed<Transaction[]>(() => trans.transfer ?? []);

// Map of `${toUserId}|${itemId}` -> current units for receiver (reactive object)
const toInvMap = reactive<Record<string, number>>({});

async function preloadToInventories(list: Transaction[]) {
  const ids = Array.from(new Set(list.map((t) => String((t as any).toUserId || '')).filter(Boolean)));
  if (!ids.length) return;
  for (const uid of ids) {
    const inv = await inventory.fetchUserInventory(uid);
    for (const r of inv) {
      toInvMap[`${uid}|${String(r.itemId)}`] = Number(r.units) || 0;
    }
  }
}

watch(
  items,
  (arr) => {
    if (Array.isArray(arr) && arr.length) void preloadToInventories(arr);
  },
  { immediate: true },
);

watch(status, async (st) => await refresh());

// live search with debounce
const searchTimer = ref<number | null>(null);
watch(
  rawSearch,
  (q) => {
    if (searchTimer.value) window.clearTimeout(searchTimer.value);
    searchTimer.value = window.setTimeout(() => {
      trans.fetchItems({ reset: true, status: status.value, q: String(q || '') });
    }, 300);
  },
  { flush: 'post' },
);

const statusKind = (s?: string) =>
  (({ accepted: 'success', rejected: 'danger' } as any)[s ?? ''] || 'pending');

function toBefore(t: any): number | null {
  const m = t?.meta;
  if (!m) return null;
  try {
    if (typeof m === 'string') {
      const obj = JSON.parse(m);
      return Number(obj?.toUnitsBefore ?? NaN) ?? null;
    }
    return typeof m?.toUnitsBefore !== 'undefined' ? Number(m.toUnitsBefore) : null;
  } catch {
    return null;
  }
}

function beforeAny(t: any): number | null {
  const snap = toBefore(t);
  if (snap != null) return snap;
  const now = toInvMap[`${String(t.toUserId)}|${String(t.itemId)}`];
  if (now == null || !Number.isFinite(Number(now))) return null;
  const approxBefore = Math.max(0, Number(now) - Number(t.units || 0));
  return approxBefore;
}

const pillText = (t: any) => {
  const before = beforeAny(t);
  return before != null
    ? `${fmt.units(t.units)} • (стало: ${fmt.units(before + Number(t.units))})`
    : `${fmt.units(t.units)}`;
};
</script>

<template>
  <div class="space-y-4">
    <ToolbarSearchStatus
      v-model="rawSearch"
      v-model:status="status"
      :disabled="trans.loading"
      @refresh="refresh"
    />

    <LoadingList v-if="trans.loading && !trans.hasData" />
    <EmptyState v-else-if="!items.length" text="Ничего не найдено" />
    <template v-else>
      <RowCard
        v-for="trx in items"
        :key="trx.id"
        :title="trx.item?.name ?? '—'"
        :subtitle="`SKU: ${trx.item?.sku ?? '—'}`"
        :badge="{ text: trx.status ?? '—', kind: statusKind(trx.status) as any }"
        :pill="pillText(trx)"
        :meta="[
          { icon:'👥', text:`От: ${trx.fromUser?.name ?? trx.fromUserId} → К: ${trx.toUser?.name ?? trx.toUserId}` },
          { icon:'📅', text:`Создано: ${fmt.date((trx as any).createdAt ?? (trx as any).dateCreated)}` },
          { icon:'🆔', text:`ID: ${trx.id}` },
          (function(){
            const before = toBefore(trx);
            return before != null ? { icon:'📦', text:`У получателя было: ${fmt.units(before)}` } : null;
          })(),
        ].filter(Boolean) as any"
      />

      <div style="display: flex; justify-content: center; margin-top: 12px">
        <button
          v-if="trans.hasMore"
          type="button"
          @click="trans.loadMore()"
          :disabled="trans.loading"
          style="
            padding: 8px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #fff;
            cursor: pointer;
          "
        >
          {{ trans.loading ? 'Загрузка…' : 'Показать ещё 5' }}
        </button>
      </div>
    </template>
  </div>
</template>
