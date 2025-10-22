<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useTrans } from '../../stores/transfer';
import type { Transaction } from '../../types/domain';

const trans = useTrans();
onMounted(() => trans.fetchItems);
const state = reactive<{ search: string; item: Transaction[] }>({
  search: '',
  item: [],
});

watch(
  () => trans.transfer,
  (q) => {
    state.item = q;
  },
  { immediate: true },
);

const onSearch = () => {
  console.log(state.search);
  if (state.search.length > 0) {
    console.log(state.item.filter((i) => i.id === state.search));
  }
};
</script>
<template>
  <div class="space-y-3">
    <!-- Фильтр (узкий) -->
    <div class="flex items-center gap-2">
      <input
        type="text"
        placeholder="Search…"
        class="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/5"
        v-model="state.search"
      />
      <button
        class="h-9 shrink-0 rounded-md bg-gray-900 px-3 text-sm text-white hover:bg-black"
        @click="onSearch"
      >
        Find
      </button>
    </div>

    <Card class="user-card" v-for="value in state.item" padded>
      <div class="space-y-2">
        <!-- item -->
        <div class="rounded-lg border border-gray-200 bg-white p-3">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-full bg-gray-200"></div>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-gray-900">Шнырь</div>
              <div class="text-xs text-gray-500">+7777777777</div>
            </div>
            <span class="ml-auto rounded border px-2 py-0.5 text-xs">Склад</span>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800"
              >Ожидание</span
            >
            <div class="flex flex-col">
              <span class="text-gray-500">Создано 2025-10-21</span>
              <span class="text-gray-500">ID: 03431ef6-5139-4fe8-86f7-ed9a9966df1c</span>
            </div>
          </div>

          <div class="mt-2 flex justify-end gap-2">
            <button
              class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Экран X 10
            </button>
          </div>
        </div>

        <!-- ещё карточки по образцу... -->
      </div>

      <!-- пагинация -->
      <!-- <div class="mt-3 flex items-center justify-between text-xs text-gray-600">
        <div>1–10 из 42</div>
        <div class="flex items-center gap-1">
          <button class="h-8 rounded border border-gray-200 bg-white px-2 hover:bg-gray-50">
            Prev
          </button>
          <button class="h-8 rounded bg-gray-900 px-2 text-white hover:bg-black">1</button>
          <button class="h-8 rounded border border-gray-200 bg-white px-2 hover:bg-gray-50">
            2
          </button>
          <button class="h-8 rounded border border-gray-200 bg-white px-2 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div> -->
    </Card>
  </div>
</template>
