<script setup lang="ts">
import Card from '../../components/Card.vue';
import Badge from '../../components/Badge.vue';
import Button from '../../components/Button.vue';
import ListItem from '../../components/ListItem.vue';

const props = defineProps<{
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
      <div class="title-16">Перевод #{{ value.id }}</div>
      <Badge :kind="value.status">{{ value.status }}</Badge>
    </div>
    <div class="mb12">
      От: {{ value.fromUser?.name ?? value.fromUserId ?? '—' }} • {{ formatDate(value.createdAt) }}
    </div>

    <ListItem>
      <template #default>{{ value.item?.name ?? 'Без названия' }}</template>
      <template #right
        ><span class="pill">{{ formatUnits(value.units) }}</span></template
      >
    </ListItem>

    <div v-if="value.comment" class="small mb12">Комментарий: {{ value.comment }}</div>

    <div class="btn-row">
      <Button variant="primary" :disabled="busy" :aria-busy="busy" @click="emit('accept')">
        <template v-if="busy">⏳</template><template v-else>✓</template>Подтвердить
      </Button>
      <Button variant="danger" :disabled="busy" :aria-busy="busy" @click="emit('reject')">
        <template v-if="busy">⏳</template><template v-else>✕</template>Отказать
      </Button>
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
