<script setup lang="ts">
import { onMounted } from "vue";
import Card from "../../components/Card.vue";
import { useItem } from "../../stores/item";

type ComponentRow = { name: string; qty: number };
type GoodRow = { name: string; sku: string; components: ComponentRow[] };

const item = useItem()

onMounted(async () => {
  await item.fetchItems()
  console.log(item.items)
})

const goods: GoodRow[] = [
  {
    name: "Smartphone Assembly",
    sku: "SP-001",
    components: [
      { name: "Screen", qty: 1 },
      { name: "Battery", qty: 1 },
      { name: "Circuit Board", qty: 1 },
    ],
  },
  {
    name: "Laptop Kit",
    sku: "LP-002",
    components: [
      { name: "Motherboard", qty: 1 },
      { name: "RAM Module", qty: 2 },
      { name: "Storage Drive", qty: 1 },
    ],
  },
];
</script>

<template>
  <div>
    <Card v-for="g in goods" :key="g.sku" padded class="good-card">
      <div class="head">
        <div class="title-16">{{ g.name }}</div>
        <div class="actions">
          <button class="icon-btn ghost" title="Edit">✎</button>
          <button class="icon-btn danger" title="Delete">🗑</button>
        </div>
      </div>
      <div class="muted">SKU: {{ g.sku }}</div>

      <div class="muted mt12">Components:</div>
      <div class="comp-list mt8">
        <div class="comp" v-for="c in g.components" :key="c.name">
          <span>📦 {{ c.name }}</span>
          <span class="pill">{{ c.qty }}x</span>
        </div>
      </div>
    </Card>
  </div>
</template>


<style scoped>
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
