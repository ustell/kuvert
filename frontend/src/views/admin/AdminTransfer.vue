<!-- pages/transfers/index.vue -->
<script setup lang="ts">
import RowCard from '../../components/RowCard.vue';
import ToolbarSearchStatus from '../../components/list/ToolbarSearchStatus.vue';
import LoadingList from '../../components/common/LoadingList.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import { onMounted, computed, ref, watch } from 'vue';
import { useTrans } from '../../stores/transfer';
import type { Transaction } from '../../types/domain';
import { useFormat } from '../../composables/useFormat';

const trans = useTrans();
const fmt = useFormat('ru-RU');

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
        :pill="fmt.units(trx.units)"
        :meta="[
          { icon:'👥', text:`От: ${trx.fromUser?.name ?? trx.fromUserId} → К: ${trx.toUser?.name ?? trx.toUserId}` },
          { icon:'📅', text:`Создано: ${fmt.date((trx as any).createdAt ?? (trx as any).dateCreated)}` },
          { icon:'🆔', text:`ID: ${trx.id}` },
          (trx as any).meta ? { icon:'💬', text:`Комментарий: ${typeof (trx as any).meta === 'string' ? (trx as any).meta : JSON.stringify((trx as any).meta)}` } : null
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
