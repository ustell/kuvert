<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { Card, Badge, Button, Options } from '../components';
import { SelectItem } from '../components/ui/select';
import { useUsers, useAuth } from '../stores';
import TransferModal from '../components/modal/TransferModal.vue';

import type { Inventory } from '../types/domain';
import type { User } from '../libs/authApi';
import { useTrans } from '../stores/transfer';

/** ================= Типы ================= */
type InventoryWithQty = Inventory & { qty: number };
type State = {
  open: boolean;
  userInv: InventoryWithQty[];
  toUser: User | null;
  error: string[] | null;
  loading: boolean;
  touched: boolean;
};

/** =============== Сторы/данные =============== */
const authStore = useAuth();
const usersStore = useUsers();
const trans = useTrans();

// держим в реактивном виде — если стор обновится, UI не застрянет
const currentUser = computed<User>(() => authStore.users as unknown as User);
const users = computed<User[]>(() => usersStore.users as unknown as User[]);

const state = reactive<State>({
  open: false,
  userInv: [],
  toUser: null,
  error: null,
  loading: false,
  touched: false,
});

const toUserId = ref<string | null>(null);

// вычисляем получателя из списка юзеров
const toUser = computed<User | null>(
  () => users.value.find((u) => String(u.id) === String(toUserId.value ?? '')) ?? null,
);

// синхронизируем state.toUser, чтобы ниже проще валидировать
const syncToUser = () => {
  state.toUser = toUser.value;
};
onMounted(syncToUser);

watch(toUserId, () => {
  syncToUser();
});

/** ===== UI действия ===== */

// добавление позиции: мерджим, ограничиваем по units
const selectedItem = (i: Inventory) => {
  state.touched = true;

  const units = Number((i as Inventory).units ?? 0);
  const existing = state.userInv.find((row) => row.id === i.id);

  if (existing) {
    // увеличиваем qty, но не выше доступных units
    const next = Math.min((existing.qty ?? 0) + 1, units);
    existing.qty = next;
    return;
  }

  const initialQty = Math.min(1, units);
  const row: InventoryWithQty = { ...(i as Inventory), qty: initialQty };
  if (initialQty > 0) state.userInv.push(row);
};

// инкремент/декремент с жёсткими границами
const inc = (i: InventoryWithQty) => {
  const max = Number(i.units ?? 0);
  const curr = Number(i.qty ?? 0);
  if (curr < max) {
    i.qty = curr + 1;
  }
};

const dec = (i: InventoryWithQty) => {
  const curr = Number(i.qty ?? 0);
  if (curr > 1) {
    i.qty = curr - 1;
    return;
  }
  // при 1 -> удаляем позицию
  if (curr === 1) {
    const idx = state.userInv.findIndex((x) => x.id === i.id);
    if (idx !== -1) state.userInv.splice(idx, 1);
  }
};

// базовая валидация формы
function validate(): string[] {
  const errs: string[] = [];
  if (!currentUser.value?.id) errs.push('Текущий пользователь не найден.');
  if (!toUserId.value) errs.push('Выберите пользователя-получателя.');
  if (toUserId.value && toUserId.value === currentUser.value?.id)
    errs.push('Нельзя передавать товары самому себе.');
  if (state.userInv.length === 0) errs.push('Добавьте хотя бы одну позицию.');
  // проверка остатков
  for (const it of state.userInv) {
    const units = Number(it.units ?? 0);
    const qty = Number(it.qty ?? 0);
    if (qty <= 0) errs.push(`Количество для "${it.item?.name ?? it.id}" должно быть больше 0.`);
    if (qty > units)
      errs.push(
        `Недостаточно "${it.item?.name ?? it.id}" на складе (есть: ${units}, запрошено: ${qty}).`,
      );
  }
  return errs;
}

async function save() {
  state.touched = true;
  state.error = null;

  const errors = validate();
  if (errors.length) {
    state.error = errors;
    return;
  }

  state.loading = true;
  try {
    // !!! ВАЖНО: этот вызов — без изменений, как вы просили
    await useTrans().create(
      currentUser.value.id,
      toUserId.value,
      state.userInv.map((i) => i),
      state.userInv.map((i) => i.qty),
    );
    // если нужно, можно ориентироваться на res, но верстку не меняем
    // успешный кейс: очищаем форму
    state.userInv = [];
    toUserId.value = null;
    state.toUser = null;
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Неизвестная ошибка при создании передачи.';
    state.error = [msg];
  } finally {
    state.loading = false;
    // актуализируем список трансферов
    trans.fetchItems();
  }
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Создать передачу</div>
      <div class="muted">Transfer goods between users</div>
    </div>

    <Card padded>
      <div class="card-title">Transfer Details</div>
      <label class="label">From User</label>
      <div class="field disabled">
        <span class="placeholder"
          >Текущий пользователь: <b>{{ currentUser?.name }}</b></span
        >
        <span class="chev">▾</span>
      </div>

      <label class="label mt12">To User</label>
      <div class="field disabled">
        <Options v-model="toUserId">
          <SelectItem
            v-for="v in users.filter((i) => i.id !== currentUser?.id)"
            :key="v.id"
            :value="v.id"
            class="px-3 py-2 cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          >
            <p>{{ v.name }}</p>
          </SelectItem>
        </Options>
      </div>
    </Card>

    <Card padded>
      <div class="row-between">
        <div class="card-title">Items to Transfer</div>
        <Button variant="soft" @click="state.open = true">＋ Add Item</Button>
      </div>

      <template v-if="state.userInv.length > 0">
        <div
          v-for="value in state.userInv"
          :key="value.id"
          class="mb-5 rounded-lg border border-gray-200 bg-white p-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-base font-medium">{{ value.item?.name }}</div>
              <div
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600"
              >
                В наличии: <b class="ml-1">{{ value.units }}</b>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button class="rounded bg-gray-100 px-2 py-1" @click="dec(value)">−</button>
              <input
                type="number"
                :value="value.qty"
                class="w-14 rounded border px-2 py-1 text-center"
                readonly
              />
              <button class="rounded bg-gray-100 px-2 py-1" @click="inc(value)">+</button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty">
        <div class="empty-ic">📦</div>
        <div>No items added yet</div>
        <div class="small">Click "Add Item" to get started</div>
      </div>
    </Card>

    <TransferModal
      v-model="state.open"
      title="Проверить позиции"
      :userInv="currentUser?.inventories"
      @select="selectedItem"
    />

    <Button
      variant="primary"
      :full="true"
      class="mt-3"
      @click="save"
      :class="!toUser ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''"
      :aria-disabled="!toUser || state.userInv.length === 0"
    >
      ✈ Create Transfer
    </Button>

    <Card padded>
      <div class="card-title">Recent Transfers</div>
      <div
        class="transfer-preview"
        v-for="value in trans.transfer?.filter((i) => i.fromUserId === currentUser.id)"
      >
        <div class="row-top">
          <div class="flex flex-col">
            <span>От: {{ value.fromUser?.name }} </span><span>К: {{ value.toUser?.name }}</span>
          </div>
          <Badge kind="pending">{{ value.status }}</Badge>
          <!-- <span>{{ value.createdAt }}</span> -->
        </div>
        <div class="row-sub">{{ value.item?.name }} x {{ value.units }}</div>
      </div>
    </Card>
  </div>
</template>
