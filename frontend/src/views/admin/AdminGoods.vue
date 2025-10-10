<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Button from '../../components/Button.vue';
import Card from '../../components/Card.vue';
import { useItem } from '../../stores/item';
import GoodModal from '../../components/modal/GoodModal.vue';
import type { Item } from '../../types/domain';

const store = useItem();
const editItem = ref<Item | null>();
const open = ref(false);

onMounted(async () => {
  await store.fetchItems();
});

async function delGoods(itemID: string) {
  try {
    if (!itemID) {
      console.log('Нет ID');
    }
    const res = await store.deleteItem(itemID);
    return res;
  } catch (e) {
    console.log('Произошла ошибка', e);
  }
}

async function addGood({ sku, name, comp }: { sku: string; name: string; comp: Object }) {
  try {
    // TODO ПРОВЕРКА НА ТО ИЗМЕНЕНО ЛИ ЗНАЧЕНИЕ
    console.log(sku, name, comp);
    const res = await store.createItem(sku, name, comp);
    return res;
  } catch (error) {
    console.log('Произошла ошибка с добавлением', error);
  }
}

async function editGood({ sku, name, comp }: { sku: string; name: string; comp: Object }) {
  try {
    const res = await store.updateItem(editItem.value!.id, sku, name, comp);
    console.log('addmin', res, comp);
    return res;
  } catch (error) {
    console.log(error, 'error');
  }
}

function selectItem(item: Item) {
  console.log('selectItem', item);
  open.value = true;
  editItem.value = item;
}
</script>

<template>
  <div>
    <Button variant="primary" :full="true" class="mt12" @click="open = true">
      ＋ Добавить новый элемент
    </Button>

    <div class="spinner" v-if="store.loading"></div>
    <Card v-else v-for="g in store.items" :key="g.sku" padded class="good-card">
      <div class="head">
        <div class="title-16">{{ g.name }}</div>
        <div class="actions">
          <button class="icon-btn ghost" title="Edit" @click="selectItem(g)">✎</button>
          <button class="icon-btn danger" title="Delete" @click="delGoods(g.id)">🗑</button>
        </div>
      </div>
      <div class="muted">SKU: {{ g.sku }}</div>
    </Card>
  </div>
  <GoodModal
    v-model="open"
    title="Товар"
    v-model:currentItem="editItem"
    @save="addGood"
    :items="store.items"
    @update="editGood"
  />
</template>

<style scoped>
.spinner {
  margin: 40px auto;
  border: 6px solid #eee;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.good-card {
  padding: 12px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.actions {
  display: flex;
  gap: 8px;
}

.comp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f2f4f8;
}

.icon-btn {
  appearance: none;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.icon-btn.danger {
  background: #fff5f5;
  border-color: #ffd7d7;
  color: #c02626;
}

.mt8 {
  margin-top: 8px;
}

.mt12 {
  margin-top: 12px;
}
</style>
