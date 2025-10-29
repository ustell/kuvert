<script setup lang="ts">
import RowCard from '../../components/RowCard.vue';
import IconBtn from '../../components/IconBtn.vue';
import Button from '../../components/Button.vue';
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
async function addGood(p: { sku: string; name: string; comp: Record<string, unknown> }) {
  await act(() => store.createItem(p.sku, p.name, p.comp), {
    messages: { success: 'Товар создан', error: 'Ошибка при добавлении товара' },
  });
  open.value = false;
}
async function editGood(p: { sku: string; name: string; comp: Record<string, unknown> }) {
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
    <Button variant="primary" :full="true" class="mt12" @click="open = true"
      >＋ Добавить новый элемент</Button
    >

    <LoadingList v-if="store.loading" />
    <EmptyState v-else-if="!store.items?.length" text="Пока нет товаров" />

    <template v-else>
      <RowCard
        v-for="g in store.items"
        :key="g.id ?? g.sku"
        :title="g.name"
        :subtitle="`SKU: ${g.sku}`"
      >
        <template #avatar>📦</template>
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
