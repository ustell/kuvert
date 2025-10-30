<script setup lang="ts">
import {Package} from 'lucide-vue-next';

import RowCard from '../../components/RowCard.vue';
import IconBtn from '../../components/IconBtn.vue';
import Button from '../../components/Button.vue';
import SearchList from '../../components/SearchList.vue';
import GoodModal from '../../components/modal/GoodModal.vue';
import LoadingList from '../../components/common/LoadingList.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import { onMounted, ref } from 'vue';
import { useItem } from '../../stores/item';
import type { Item } from '../../types/domain';
import { useAction } from '../../composables/useAction';
import { useBusySet } from '../../composables/useBusySet';
import { useConfirmDelete } from '../../composables/useConfirmDelete';

const store = useItem();
const { act } = useAction();
const busy = useBusySet();

const editItem = ref<Item | null>(null);
const open = ref(false);
const confirmDelete = useConfirmDelete('Удалить товар? Это действие необратимо.');

onMounted(() => {
  // load items (no client-side limit by default)
  store.fetchItems().catch(console.error);
});

async function delGoods(id?: string) {
  if (!id) return;
  if (!(await confirmDelete())) return;
  await busy.wrap(id, () =>
    act(() => store.deleteItem(id), {
      messages: { success: 'Товар удалён', error: 'Не удалось удалить товар' },
    }),
  );
}
async function addGood(p: { sku: string; name: string; comp: { sku: string; qty: number }[] }) {
  await act(() => store.createItem(p.sku, p.name, p.comp), {
    messages: { success: 'Товар создан', error: 'Ошибка при добавлении товара' },
  });
  open.value = false;
}
async function editGood(p: {
  sku: string;
  name: string;
  comp: { id?: string; sku?: string; qty?: number }[];
}) {
  const id = editItem.value?.id;
  if (!id) return;
  await act(() => store.updateItem(id, p.sku, p.name, p.comp), {
    messages: { success: 'Товар обновлён', error: 'Ошибка при обновлении товара' },
  });
  open.value = false;
  editItem.value = null;
}
const selectItem = (g: Item) => {
  open.value = true;
  editItem.value = g;
};
</script>

<template>
  <div>
    <Button variant="primary" :full="true" class="" @click="open = true"
      >＋ Добавить новый элемент</Button
    >

    <SearchList
      :items="store.items ?? []"
      :loading="store.loading"
      placeholder="Поиск по названию или SKU"
    >
      <template #loading>
        <LoadingList />
      </template>

      <template #default="{ items }">
        <EmptyState v-if="!items.length" text="Ничего не найдено" />
        <div v-else>
          <template v-for="g in items" :key="g.id ?? g.sku">
            <RowCard :title="g.name" :subtitle="`SKU: ${g.sku}`">
              <template #avatar><Package :size="16" color="#333333" /></template>
              <template #actions>
                <IconBtn title="Редактировать" @click="selectItem(g)">✎</IconBtn>
                <IconBtn
                  :disabled="busy.has(g.id)"
                  title="Удалить"
                  variant="danger"
                  @click="delGoods(g.id)"
                >
                  <template v-if="busy.has(g.id)">⏳</template><template v-else>🗑</template>
                </IconBtn>
              </template>
            </RowCard>
          </template>
        </div>
      </template>
    </SearchList>

    <GoodModal
      v-model="open"
      title="Товар"
      v-model:currentItem="editItem"
      :items="store.items"
      @save="addGood"
      @update="editGood"
    />
  </div>
</template>
