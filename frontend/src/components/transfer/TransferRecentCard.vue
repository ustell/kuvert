<script setup lang="ts">
import Card from '../../components/Card.vue';
import Badge from '../../components/Badge.vue';

const { items, loading, formatDate, formatUnits } = defineProps<{
  items: Array<any>;
  loading?: boolean;
  formatDate: (d: any) => string;
  formatUnits: (u: any) => string;
}>();
</script>

<template>
  <Card padded>
    <div class="row-between mb8">
      <div class="card-title">Недавние переводы</div>
      <span v-if="loading" class="chip">Загрузка…</span>
    </div>

    <template v-if="!loading && items.length === 0">
      <div class="small">Пока нет исходящих переводов.</div>
    </template>
    <template v-else>
      <div>
        <template v-for="v in items" :key="v.id">
          <div class="border-b border-gray-100 py-2">
            <div class="row-top">
              <div class="flex flex-col">
                <span>От: {{ v.fromUser?.name ?? v.fromUserId }}</span>
                <span>К: {{ v.toUser?.name ?? v.toUserId }}</span>
              </div>
              <Badge :kind="v.status">{{ v.status }}</Badge>
              <span>{{ formatDate(v.createdAt) }}</span>
            </div>
            <div class="row-sub">
              {{ v.item?.name ?? 'Без названия' }} × {{ formatUnits(v.units) }}
            </div>
          </div>
        </template>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.row-top {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.row-sub {
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.95rem;
}
.mb8 {
  margin-bottom: 8px;
}
.chip {
  background: #f3f4f6;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
}
.small {
  font-size: 0.95rem;
}
</style>
