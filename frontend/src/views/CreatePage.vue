<script setup lang="ts">
import Button from '../components/Button.vue';
import TransferModal from '../components/modal/TransferModal.vue';
import TransferDetailsCard from '../components/transfer/TransferDetailsCard.vue';
import TransferItemsCard from '../components/transfer/TransferItemsCard.vue';
import TransferRecentCard from '../components/transfer/TransferRecentCard.vue';

import { computed, reactive, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import type { Inventory } from '../types/domain';
import { useUsers, useAuth } from '../stores';
import { useTrans } from '../stores/transfer';
import { useAction } from '../composables/useAction';
import { useFormat } from '../composables/useFormat';
import { useNotify } from '../stores/notify';

type InventoryWithQty = Inventory & { qty: number };
type State = {
  open: boolean;
  userInv: InventoryWithQty[];
  error: string[] | null;
  touched: boolean;
};

const { act } = useAction();
const fmt = useFormat('ru-RU');
const auth = useAuth();
const users = useUsers();
const trans = useTrans();
const notify = useNotify();
const abortCtl = new AbortController();

const currentUser = computed(() => auth.users);
const toUserId = ref<string | null>(null);
const allowedTargets = computed(() => (auth.users as any)?.allowedTargets ?? []);
const state = reactive<State>({ open: false, userInv: [], error: null, touched: false });

const toUser = computed(
  () => (users.users ?? []).find((u) => String(u.id) === String(toUserId.value ?? '')) ?? null,
);

function addSelectedItem(inv: Inventory) {
  state.touched = true;
  const exists = state.userInv.find((x) => x.id === inv.id);
  if (exists) {
    const next = Number(exists.qty || 0) + 1;
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
 * Pick a message from an object or return null if object is falsy.
 * If object is a string, return it.
 * If object has a status property with value 'INSUFFICIENT_STOCK_AND_NO_RECIPE',

 * Otherwise, return a JSON string representation of the object or its string value.
 * @param {any} x - object to pick a message from
 * @returns {string|null} - picked message or null
 */
  } else {
    state.userInv.push({ ...(inv as Inventory), qty: 1 });
  }
}

function formatServerIssue(raw: any): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;

  const status = String(raw.status ?? '').toUpperCase();

  if (status === 'INSUFFICIENT_STOCK_AND_NO_RECIPE') {
    const d = raw.details ?? {};
    const rq = Number(d.requestedQty ?? 0);
    const ar = Number(d.availableReady ?? 0);
    const ntc = Number(d.needToCraft ?? 0);
    const available = Math.max(0, ar);

    const nameMatch = String(raw.message ?? '').match(/товара\s+(.+?)\s+не хватает/i);
    const itemName = nameMatch?.[1] ?? 'товара';

    return [
      `Недостаточно доступного ${itemName}.`,
      `Запрошено: ${rq}. Доступно: ${available}.`,
      ntc > 0 ? `Нужно произвести: ${ntc}.` : null,
      `Рецепта для производства не найдено.`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (raw.message) return String(raw.message);
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function showErrors(msgs: string[]) {
  const unique = msgs
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter((s) => {
      if (!s) return false;
      const looksLikeJson = s.startsWith('{') || s.startsWith('[');
      if (!looksLikeJson) return true;
      try {
        const obj = JSON.parse(s);
        if (obj && typeof obj === 'object' && ('ok' in obj || 'errors' in obj || 'status' in obj)) {
          return false;
        }
      } catch (_) {
        return true;
      }
      return false;
    })
    .filter((v, i, a) => a.indexOf(v) === i);

  if (unique.length === 0) unique.push('Произошла ошибка');

  unique.forEach((msg, i) => {
    // первый — липкий, остальные авто
    notify.error(msg, i === 0 ? 0 : 5000);
  });
  return unique;
}

function extractErrorMessages(res: any, fallbackTop: string): string[] {
  const details: string[] = [];

  // 1) issues (если стор их отдаёт)
  if (Array.isArray(res?.issues)) {
    for (const it of res.issues) {
      const m =
        formatServerIssue(it) ||
        (typeof it === 'object' ? it?.message : typeof it === 'string' ? it : '');
      if (m) details.push(String(m).trim());
    }
  }

  const single = res?.errorBody ?? res?.data ?? null;
  if (single) {
    const m =
      formatServerIssue(single) ||
      (typeof single === 'object' ? single?.message : typeof single === 'string' ? single : '');
    if (m) {
      const s = String(m).trim();
      if (!details.includes(s)) details.push(s);
    }
  }

  if (details.length === 0) {
    const top = (res?.error && String(res.error)) || fallbackTop || 'Произошла ошибка';
    return [top];
  }

  // 4) есть детальные — возвращаем только их (без общего top)
  //    + уберём явные «json-подобные» строки
  return details.filter((s) => {
    const text = String(s);
    const looksLikeJson = text.startsWith('{') || text.startsWith('[');
    if (!looksLikeJson) return true;
    try {
      const obj = JSON.parse(text);
      if (obj && typeof obj === 'object' && ('ok' in obj || 'errors' in obj || 'status' in obj)) {
        return false;
      }
    } catch (_) {
      return true;
    }
    return false;
  });
}

function validate(): string[] {
  const e: string[] = [];
  if (!currentUser.value?.id) e.push('Текущий пользователь не найден.');
  if (!toUserId.value) e.push('Выберите пользователя-получателя.');
  if (toUserId.value && toUserId.value === String(currentUser.value?.id))
    e.push('Нельзя передавать товары самому себе.');
  if (state.userInv.length === 0) e.push('Добавьте хотя бы одну позицию.');

  for (const it of state.userInv) {
    const n = Number(it.qty);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
      e.push(`Некорректное количество для позиции ${it.itemId ?? it.id}.`);
    }
  }

  return Array.from(new Set(e));
}

watch(
  [toUserId, () => state.userInv],
  () => {
    if (state.error?.length) state.error = null;
  },
  { deep: true },
);

const canSave = computed(
  () => !trans.creating && !trans.loading && validate().length === 0 && !!toUser.value,
);

async function save() {
  if (trans.creating) return;

  state.touched = true;
  state.error = null;

  const errs = validate();
  if (errs.length) {
    state.error = showErrors(errs);
    return;
  }

  const items = state.userInv.map((i) => ({ id: i.id, itemId: i.itemId, qty: i.qty }));
  const qtys = state.userInv.map((i) => i.qty);

  const res = await act(
    () => trans.create(String(currentUser.value?.id), String(toUserId.value), items, qtys),
    {
      messages: { success: '', error: '' },
      ok: (r: any) => !!r?.ok,
    },
  );

  if (res?.ok) {
    notify.success('Передача создана', 2500);
    state.userInv = [];
    toUserId.value = null;
    if (!res.data?.length) {
      await act(() => trans.fetchItems(abortCtl.signal)).catch(() => {});
    }
    return;
  }

  const msgs = extractErrorMessages(res, 'Не удалось создать передачу');
  state.error = showErrors(msgs);
}

onMounted(() => {
  if (!trans.hasData) trans.fetchItems(abortCtl.signal).catch(console.error);
});
onBeforeUnmount(() => abortCtl.abort());

const myRecent = computed(() =>
  (trans.transfer ?? []).filter((t) => String(t.fromUserId) === String(currentUser.value?.id)),
);
</script>

<template>
  <div class="container">
    <div class="page-head"><div class="title-18">Создать передачу</div></div>

    <TransferDetailsCard
      :current-user-name="currentUser?.name"
      :allowed-targets="allowedTargets"
      v-model="toUserId"
      :disabled="trans.creating"
      :touched="state.touched"
    />

    <TransferItemsCard
      v-model="state.userInv"
      :disabled="trans.creating"
      @add-request="state.open = true"
    />

    <TransferModal
      v-model="state.open"
      title="Проверить позиции"
      :userInv="currentUser?.inventories"
      @select="addSelectedItem"
    />

    <Button
      variant="primary"
      :full="true"
      class="mt-3"
      @click="save"
      :disabled="!canSave"
      :aria-busy="trans.creating"
    >
      <template v-if="trans.creating">⏳</template><template v-else>✈</template> Создать перевод
    </Button>

    <TransferRecentCard
      :items="myRecent"
      :loading="trans.loading && !trans.transfer"
      :format-date="fmt.date"
      :format-units="fmt.units"
    />
  </div>
</template>
