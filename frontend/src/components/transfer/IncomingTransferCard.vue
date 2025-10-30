<script setup lang="ts">
import Card from '../../components/Card.vue';
import Badge from '../../components/Badge.vue';
import Button from '../../components/Button.vue';
import ListItem from '../../components/ListItem.vue';

const { value, busy, formatDate, formatUnits } = defineProps<{
  value: any; // один transfer
  busy: boolean;
  formatDate: (d: any) => string;
  formatUnits: (u: any) => string;
}>();
const emit = defineEmits<{ (e: 'accept'): void; (e: 'reject'): void }>();
</script>

<template>
  <Card padded>
    <div class="row-between mb8">
      <div class="title-16">
        От: {{ value.fromUser?.name ?? value.fromUserId ?? '—' }} • {{ formatDate(value.createdAt) }}
      </div>
      <Badge :kind="value.status">{{ value.status }}</Badge>
    </div>
    <div class="mb12">
    </div>

    <ListItem>
      <template #default>{{ value.item?.name ?? 'Без названия' }}</template>
      <template #right
        ><span class="pill">{{ formatUnits(value.units) }}</span></template
      >
    </ListItem>

    <div v-if="value.comment" class="small mb12">Комментарий: {{ value.comment }}</div>

    <div class="btn-row">
      <Button variant="primary" :loading="busy" @click="emit('accept')">✓ Подтвердить</Button>
      <Button variant="danger" :loading="busy" @click="emit('reject')">✕ Отказать</Button>
    </div>
  </Card>
</template>

<style scoped>
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pill {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.9rem;
}
.mb8 {
  margin-bottom: 8px;
}
.mb12 {
  margin-bottom: 12px;
}
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.small {
  font-size: 0.9rem;
}
</style>
