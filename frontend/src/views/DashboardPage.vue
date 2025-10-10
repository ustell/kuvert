<script setup lang="ts">
import Card from '../components/Card.vue';
import Badge from '../components/Badge.vue';
import ListItem from '../components/ListItem.vue';
import { storeToRefs } from 'pinia';
import { useAuth } from '../stores/auth';
import { computed } from 'vue';

const auth = useAuth();
const { users } = storeToRefs(auth);

const inventories = computed(() => users.value?.inventories ?? []);
</script>

<template>
  <div class="container">
    <div class="welcome">
      <div class="muted">
        Добро пожаловать, <b>{{ users?.name }}</b>
      </div>
      <div class="title">Production Tracking Dashboard</div>
    </div>

    <div class="grid-2">
      <Card padded>
        <div class="stat">
          <div class="stat-ic">⏱️</div>
          <div class="stat-num">1</div>
          <div class="stat-sub">Ожидают подтверждения</div>
        </div>
      </Card>
      <Card padded>
        <div class="stat">
          <div class="stat-ic flex">📦</div>
          <div class="stat-num">{{ users?.inventories?.length }} товара</div>
          <div class="stat-sub">В вашем инвентаре</div>
        </div>
      </Card>
    </div>

    <Card padded>
      <div class="card-title">Недавние переводы для Вас</div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>From: Mike Johnson</span>
          <Badge kind="pending">ожидается</Badge>
          <span class="muted">16.01.2024</span>
        </div>
        <div class="row-sub muted">3x Smartphone Assembly, 2x Laptop Kit</div>
      </div>
    </Card>

    <Card padded>
      <div class="card-title">Мой инвентарь</div>
      <ListItem v-for="inv in inventories" :key="inv.id ?? inv.item?.id">
        <template #default>{{ inv.item?.name ?? '—' }}</template>
        <template #right
          ><span class="pill">{{ inv.units ?? 0 }}</span></template
        >
      </ListItem>

      <ListItem>
        <template #default>Laptop Kit</template>
        <template #right>
          <span class="pill">12 units</span>
        </template>
      </ListItem>
    </Card>
  </div>
</template>
