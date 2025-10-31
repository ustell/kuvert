<script setup lang="ts">
import {Timer, Package} from 'lucide-vue-next';

import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import Card from '../components/Card.vue';
import Badge from '../components/Badge.vue';
import ListItem from '../components/ListItem.vue';

import { useAuth } from '../stores/auth';
import { useTrans } from '../stores/transfer';
import type { Inventory, Transaction } from '../types/domain';
import { useFormat } from '../composables/useFormat';
import { useRouter } from 'vue-router';

const fmt = useFormat('ru-RU');
const router = useRouter();
const auth = useAuth();
const trans = useTrans();
const { users: me, isFetchingMe } = storeToRefs(auth);
const { transfer, loading } = storeToRefs(trans);

const inventories = computed<Inventory[]>(() => me.value?.inventories ?? []);
const incoming = computed<Transaction[]>(() =>
  (transfer.value ?? []).filter((t) => String(t.toUserId ?? t.toUser?.id) === String(me.value?.id)),
);

const inventoryCount = computed(() => inventories.value.length);
const pendingIncomingCount = computed(
  () => incoming.value.filter((t) => t.status === 'pending').length,
);

const onLogout = async () => {
  await auth.logout(); // или auth.logout(true) если бэк-logout не добавляешь
  router.replace('/login'); // адаптируй под свой маршрут
};

// ensure we fetch transfers targeted to current user
import { onMounted, watch } from 'vue';
const tryLoadIncoming = async () => {
  const id = String(me.value?.id || '');
  if (!id) return;
  await trans.fetchItems({ reset: true, mine: 'to', userId: id, status: 'all' });
};
onMounted(tryLoadIncoming);
watch(() => me.value?.id, tryLoadIncoming);
</script>

<template>
  <div class="container space-y-6">
    <div class="welcome flex justify-between">
      <div>
        Добро пожаловать, <b>{{ me?.name ?? 'пользователь' }}</b>
      </div>
      <button class="link-btn" @click="onLogout">Выйти</button>
    </div>

    <div class="grid-2 gap-4">
      <Card padded>
        <div class="stat">
          <div class="stat-ic"><Timer :size="16" color="#333333" /></div>
          <div class="stat-num">{{ pendingIncomingCount }}</div>
          <div>Ожидают подтверждения</div>
        </div>
      </Card>

      <Card padded>
        <div class="stat">
          <div class="stat-ic"><Package :size="16" color="#333333" /></div>
          <div class="stat-num">{{ inventoryCount }} товара</div>
          <div>В вашем инвентаре</div>
        </div>
      </Card>
    </div>

    <Card padded>
      <div class="card-title">Недавние переводы для Вас</div>

      <div v-if="loading" class="text-center text-gray-500 py-4">Загрузка...</div>

      <template v-else>
        <div v-if="incoming.length === 0" class="text-center text-gray-500 py-4 text-sm">
          Переводов пока нет.
        </div>

        <div
          v-for="t in incoming"
          :key="t.id"
          class="transfer-preview border-b border-gray-100 py-2"
        >
          <div class="row-top">
            <span>От: {{ t.fromUser?.name ?? '—' }} </span>
            <Badge :kind="t.status">{{ t.status }}</Badge>
            <span>{{ fmt.date((t as any).createdAt ?? (t as any).dateCreated) }}</span>
          </div>

          <div class="row-sub">{{ fmt.units(t.units) }} — {{ t.item?.name ?? 'Без названия' }}</div>
        </div>
      </template>
    </Card>

    <Card padded>
      <div class="card-title">Мой инвентарь</div>

      <div v-if="isFetchingMe" class="text-center text-gray-500 py-4 text-sm">
        Загрузка инвентаря…
      </div>

      <template v-else>
        <div v-if="inventories.length === 0" class="text-center text-gray-500 py-4 text-sm">
          Инвентарь пуст — добавьте товары или обновите данные.
        </div>

        <ListItem v-for="inv in inventories" :key="inv.id ?? inv.item?.id ?? inv.itemId">
          <template #default>
            <div class="flex flex-col">
              <span class="font-medium text-sm">{{ inv.item?.name ?? '—' }}</span>
              <span class="text-xs text-gray-500">SKU: {{ inv.item?.sku ?? '—' }}</span>
            </div>
          </template>
          <template #right>
            <span class="pill">{{ fmt.units(inv.units) }}</span>
          </template>
        </ListItem>
      </template>
    </Card>
  </div>
</template>
