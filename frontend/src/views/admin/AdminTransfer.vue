<script setup lang="ts">
import RowCard from '../../components/RowCard.vue';
import ToolbarSearchStatus from '../../components/list/ToolbarSearchStatus.vue';
import LoadingList from '../../components/common/LoadingList.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import { onMounted, computed, ref, watch } from 'vue'; // ⬅️ добавили watch
import { useTrans } from '../../stores/transfer';
import type { Transaction } from '../../types/domain';
import { useDebouncedRef } from '../../composables/useDebouncedRef';
import { useFormat } from '../../composables/useFormat';
import { useAction } from '../../composables/useAction';

const trans = useTrans();
const { act } = useAction();
const fmt = useFormat('ru-RU');
onMounted(() => trans.fetchItems().catch(console.error));

const { raw: rawSearch, debounced: search } = useDebouncedRef('', 200);
type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';
const status = ref<StatusFilter>('all');

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .trim();
const items = computed<Transaction[]>(() => trans.transfer ?? []);

// ▶️ ПАГИНАЦИЯ: настройки и сброс
const PAGE = 5;
const visibleCount = ref(PAGE);
const resetVisible = () => (visibleCount.value = PAGE);

// сбрасываем при изменении выдачи, строки поиска и статуса
watch([items, search, status], () => resetVisible());

// полная отфильтрованная выборка
const filteredAll = computed(() => {
  const tokens = (norm(search.value) || '').split(/\s+/).filter(Boolean);
  const st = status.value;
  return (items.value || []).filter((t) => {
    if (st !== 'all' && String(t.status) !== st) return false;
    if (!tokens.length) return true;
    const hay = [
      t.id,
      t.item?.name,
      t.item?.sku,
      t.fromUser?.name ?? t.fromUserId,
      t.toUser?.name ?? t.toUserId,
      t.status,
    ]
      .map(norm)
      .join(' ');
    return tokens.every((x) => hay.includes(x));
  });
});

// видимая “страница”
const filtered = computed(() => filteredAll.value.slice(0, visibleCount.value));

// кнопка “загрузить ещё”
const loadMore = () => {
  visibleCount.value = Math.min(filteredAll.value.length, visibleCount.value + PAGE);
};

const statusKind = (s?: string) =>
  s === 'accepted' ? 'success' : s === 'rejected' ? 'danger' : 'pending';

const refresh = () =>
  act(() => trans.fetchItems(), {
    messages: { error: trans.error ?? 'Не удалось обновить список' },
  }).finally(() => resetVisible());
</script>

<template>
  <div class="space-y-4">
    <ToolbarSearchStatus
      v-model="rawSearch"
      v-model:status="status"
      :disabled="trans.loading"
      @refresh="refresh"
    />

    <LoadingList v-if="trans.loading" />

    <!-- если нет результатов после фильтрации/поиска -->
    <EmptyState v-else-if="!filteredAll.length" text="Ничего не найдено" />

    <!-- список текущей "страницы" -->
    <template v-else>
      <RowCard
        v-for="trx in filtered"
        :key="trx.id"
        :title="trx.item?.name ?? '—'"
        :subtitle="`SKU: ${trx.item?.sku ?? '—'}`"
        :badge="{ text: trx.status ?? '—', kind: statusKind(trx.status) as any }"
        :pill="fmt.units(trx.units)"
        :meta="[
          { icon:'👥', text:`От: ${trx.fromUser?.name ?? trx.fromUserId} → К: ${trx.toUser?.name ?? trx.toUserId}` },
          { icon:'📅', text:`Создано: ${fmt.date(trx.createdAt)}` },
          { icon:'🆔', text:`ID: ${trx.id}` },
          trx.meta ? { icon:'💬', text:`Комментарий: ${typeof trx.meta === 'string' ? trx.meta : JSON.stringify(trx.meta)}` } : null
        ].filter(Boolean) as any"
      />

      <!-- кнопка "Загрузить ещё" -->
      <div
        v-if="filteredAll.length > filtered.length"
        style="display: flex; justify-content: center; margin-top: 12px"
      >
        <button
          type="button"
          @click="loadMore"
          :disabled="trans.loading"
          style="
            padding: 8px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #fff;
            cursor: pointer;
          "
        >
          Загрузить ещё (показано {{ filtered.length }} из {{ filteredAll.length }})
        </button>
      </div>
    </template>
  </div>
</template>
