<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Card, Badge, Button, Options } from '../components';
import { SelectItem } from '../components/ui/select';
import { useUsers, useAuth } from '../stores';
import TransferModal from '../components/modal/TransferModal.vue';

import type { Inventory } from '../types/domain';
import type { User } from '../libs/authApi';
import { useTrans } from '../stores/transfer';

/** ===== Типы домена/интерфейсов ===== */

type ID = string;

type InventoryWithQty = Inventory & {
  /** кол-во к передаче (UI) */
  qty: number;
  /** нормализованный id товара (если Inventory уже хранит itemId — используем его) */
  itemId?: ID;
  item?: { id: ID; name?: string; units?: number };
};

type TransferPlan = {
  qtyRequested: number;
  transfer: { direct: number; craft: number };
  componentsToConsume: Array<{
    componentId: ID;
    componentName: string;
    perUnit: number;
    total: number;
    available?: number;
  }>;
};

type NoticeReady = {
  kind: 'ready';
  text: string;
  txId: ID; // ← добавили
  accepting: boolean; // ← добавили
  accepted: boolean; // ← добавили
  error: string | null; // ← добавили
};

type NoticeCraftable = {
  kind: 'craftable';
  text: string;
  txId: ID;
  plan: TransferPlan;
  accepting: boolean;
  accepted: boolean;
  error: string | null;
};

type MissingComponent = {
  componentId: ID;
  componentName: string;
  required: number;
  available: number;
  lack: number;
  perUnit?: number;
};

type InsufficientDetails = {
  missingComponents?: MissingComponent[];
  needToCraft?: number;
  availableReady?: number;
};

type NoticeInsufficient = {
  kind: 'insufficient';
  text: string;
  details?: InsufficientDetails;
  suggestedQty?: number;
};

type NoticeError = {
  kind: 'error';
  text: string;
};

type Notice = NoticeReady | NoticeCraftable | NoticeInsufficient | NoticeError;

/** ===== Типы ответов API transfer.create / transfer.accept ===== */

type CreateStatusErr = 'INSUFFICIENT_STOCK_AND_COMPONENTS' | 'INSUFFICIENT_STOCK_AND_NO_RECIPE';

type CreateResBase = { ok: boolean; status?: string; message?: string; error?: string };

type CreateResOkReady = CreateResBase & {
  ok: true;
  status: 'PENDING_READY';
  data: { plan: { transfer: { direct: number } } };
};

type CreateResOkCraft = CreateResBase & {
  ok: true;
  status: 'PENDING_CRAFTABLE';
  data: {
    transaction: { id: ID };
    plan: TransferPlan;
  };
};

type CreateResErrInsufficient = CreateResBase & {
  ok: false;
  status: CreateStatusErr;
  details?: InsufficientDetails;
};

type CreateResOtherErr = CreateResBase & { ok: false };

type CreateRes = CreateResOkReady | CreateResOkCraft | CreateResErrInsufficient | CreateResOtherErr;

type AcceptResOk = { ok: true };
type AcceptResErr = { ok: false; error?: string; data?: { message?: string } };
type AcceptRes = AcceptResOk | AcceptResErr;

/** ===== Состояния ===== */

const itemNotices = reactive<Record<string, Notice>>({}); // ключ = itemId

const currentUser: User = useAuth().users;
const users: User[] = useUsers().users;

const state = reactive<{
  open: boolean;
  userInv: InventoryWithQty[];
  toUser: User | null;
}>({
  open: false,
  userInv: [],
  toUser: null,
});
const toUserId = ref<string | null>(null);
const toUser = computed<User | null>(() => users.find((u) => u.id === toUserId.value) ?? null);

/** ===== Утилиты ===== */

function getItemKey(row: Pick<InventoryWithQty, 'item' | 'itemId'>): string | null {
  return row.item?.id ?? row.itemId ?? null;
}

function assertKey(row: Pick<InventoryWithQty, 'item' | 'itemId'>): string {
  const key = getItemKey(row);
  if (!key) throw new Error('Item key is missing (item.id / itemId)');
  return key;
}

function calcSuggestion(details: InsufficientDetails): number | undefined {
  const needToCraft = details.needToCraft ?? 0;
  const miss = details.missingComponents ?? [];
  const craftCut =
    miss.length === 0
      ? 0
      : Math.max(0, ...miss.map((m) => Math.ceil((m.lack ?? 0) / Math.max(1, m.perUnit ?? 1))));
  const availableReady = details.availableReady ?? 0;
  return availableReady + (needToCraft - craftCut);
}

function getInsufficientView(details?: InsufficientDetails) {
  const missingToCraft = Math.max(0, details?.needToCraft ?? 0);

  // бэкенд может прислать либо missingComponents, либо componentsToConsume
  const raw = details?.missingComponents ?? (details as any)?.componentsToConsume ?? [];

  const items = (raw as MissingComponent[]).map((m) => ({
    ...m,
    total: m.required ?? (m.perUnit && missingToCraft ? m.perUnit * missingToCraft : undefined),
  }));

  const availableReady = Math.max(0, details?.availableReady ?? 0);

  return { missingToCraft, availableReady, items };
}

/** ===== UI действия ===== */

const selectedItem = (i: Inventory) => {
  const qty = (i as any).qty ?? (i as any).units ?? 1;
  const row: InventoryWithQty = { ...i, qty: Number(qty) || 1 };
  state.userInv.push(row);
};

const inc = (i: InventoryWithQty) => {
  i.qty = (i.qty ?? 0) + 1;
};
const dec = (i: InventoryWithQty) => {
  if (i.qty && i.qty > 1) i.qty--;
};

async function save() {
  Object.keys(itemNotices).forEach((k) => delete itemNotices[k]);

  const promises = state.userInv.map(async (row) => {
    const key = getItemKey(row);
    if (!key) {
      return { row, res: { ok: false, error: 'Нет ключа товара' } as CreateResOtherErr };
    }
    const res = (await useTrans().create(
      currentUser.id,
      toUserId.value,
      row,
      row.qty,
    )) as CreateRes;
    return { row, key, res };
  });

  const results = await Promise.all(promises);

  for (const r of results) {
    const { row, res } = r as { row: InventoryWithQty; key?: string; res: CreateRes };
    const key = (r as any).key ?? getItemKey(row);
    if (!key) continue;

    if (!res?.ok) {
      if (
        res.status === 'INSUFFICIENT_STOCK_AND_COMPONENTS' ||
        res.status === 'INSUFFICIENT_STOCK_AND_NO_RECIPE'
      ) {
        const suggestedQty = res.details ? calcSuggestion(res.details) : undefined;
        itemNotices[key] = {
          kind: 'insufficient',
          text: res.message || res.error || 'Недостаточно запасов',
          details: res.details,
          suggestedQty,
        };
      } else {
        itemNotices[key] = { kind: 'error', text: res?.error || 'Ошибка' };
      }
      continue;
    }

    if (res.status === 'PENDING_READY') {
      itemNotices[key] = {
        kind: 'ready',
        txId: res.data.transaction.id, // ← важно
        text: `Готово: создана транзакция на ${res.data.plan.transfer.direct} шт. (крафт не требуется)`,
        accepting: false,
        accepted: false,
        error: null,
      };
    } else if (res.status === 'PENDING_CRAFTABLE') {
      itemNotices[key] = {
        kind: 'craftable',
        txId: res.data.transaction.id,
        plan: res.data.plan,
        text: `Можно скрафтить недостающее (${res.data.plan.transfer.craft} шт.). Подтвердите списание.`,
        accepting: false,
        accepted: false,
        error: null,
      };
    } else {
      itemNotices[key] = { kind: 'error', text: `Необработанный статус: ${String(res.status)}` };
    }
  }
}

async function applySuggestion(row: InventoryWithQty, notice: NoticeInsufficient) {
  const key = assertKey(row);
  if (!notice.suggestedQty) return;
  row.qty = notice.suggestedQty;

  const r = (await useTrans().create(currentUser.id, toUserId.value, row, row.qty)) as CreateRes;

  if (r.ok && r.status === 'PENDING_READY') {
    itemNotices[key] = {
      kind: 'ready',
      text: `Готово: создана транзакция на ${r.data.plan.transfer.direct} шт. (крафт не требуется)`,
    };
  } else if (r.ok && r.status === 'PENDING_CRAFTABLE') {
    itemNotices[key] = {
      kind: 'craftable',
      txId: r.data.transaction.id,
      plan: r.data.plan,
      text: `Можно скрафтить недостающее (${r.data.plan.transfer.craft} шт.). Подтвердите списание.`,
      accepting: false,
      accepted: false,
      error: null,
    };
  } else {
    const details = (r as CreateResErrInsufficient)?.details;
    itemNotices[key] = details
      ? {
          kind: 'insufficient',
          text: r?.message || (r as any)?.error || 'Ошибка',
          details,
          suggestedQty: calcSuggestion(details),
        }
      : { kind: 'error', text: r?.message || (r as any)?.error || 'Ошибка' };
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
                В наличии: <b class="ml-1">{{ value.units ?? value.item?.units ?? '-' }}</b>
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

          <template v-if="value.item?.id ?? value.itemId">
            <div class="mt-3" v-if="itemNotices[value.item?.id ?? value.itemId!]">
              <div
                class="rounded-md p-3 text-sm shadow-sm ring-1"
                :class="{
                  'bg-green-50 ring-green-200': itemNotices[value.item?.id ?? value.itemId!].kind === 'ready',
                  'bg-amber-50 ring-amber-200': itemNotices[value.item?.id ?? value.itemId!].kind === 'craftable',
                  'bg-red-50 ring-red-200': itemNotices[value.item?.id ?? value.itemId!].kind === 'insufficient' || itemNotices[value.item?.id ?? value.itemId!].kind === 'error',
                }"
              >
                <div class="mb-1">
                  <template v-if="itemNotices[value.item?.id ?? value.itemId!].kind === 'ready'"
                    >✅</template
                  >
                  <template
                    v-else-if="itemNotices[value.item?.id ?? value.itemId!].kind === 'craftable'"
                    >⚠️</template
                  >
                  <template v-else>⛔</template>
                  <span class="font-medium ml-1">
                    {{ itemNotices[value.item?.id ?? value.itemId!].text }}
                  </span>
                </div>

                <!-- craftable details -->
                <template v-if="itemNotices[value.item?.id ?? value.itemId!].kind === 'craftable'">
                  <div class="mt-1 text-[13px] text-gray-700">
                    К передаче:
                    <b>{{
                      (itemNotices[value.item?.id ?? value.itemId!] as any).plan.qtyRequested
                    }}</b>
                    шт.
                    <span class="text-gray-500">
                      (готовых:
                      {{
                        (itemNotices[value.item?.id ?? value.itemId!] as any).plan.transfer.direct
                      }}, крафт:
                      {{
                        (itemNotices[value.item?.id ?? value.itemId!] as any).plan.transfer.craft
                      }})
                    </span>
                  </div>
                  <ul class="mt-2 list-disc pl-5 text-[13px] text-gray-700">
                    <li
                      v-for="c in (itemNotices[value.item?.id ?? value.itemId!] as any).plan.componentsToConsume"
                      :key="c.componentId"
                    >
                      {{ c.componentName }} — {{ c.perUnit }} ×
                      {{
                        (itemNotices[value.item?.id ?? value.itemId!] as any).plan.transfer.craft
                      }}
                      =
                      <b>{{ c.total }}</b>
                      <span v-if="c.available !== undefined" class="text-gray-500">
                        (в наличии: {{ c.available }})
                      </span>
                    </li>
                  </ul>
                  <div class="mt-2 flex items-center gap-2">
                    <button
                      class="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
                      :disabled="(itemNotices[value.item?.id ?? value.itemId!] as any).accepting || (itemNotices[value.item?.id ?? value.itemId!] as any).accepted"
                      @click="create(itemNotices[value.item?.id ?? value.itemId!])"
                    >
                      {{
                        (itemNotices[value.item?.id ?? value.itemId!] as any).accepted
                          ? 'Подтверждено'
                          : (itemNotices[value.item?.id ?? value.itemId!] as any).accepting
                          ? 'Подтверждаем…'
                          : 'ОК — подтвердить перевод'
                      }}
                    </button>
                    <span
                      v-if="(itemNotices[value.item?.id ?? value.itemId!] as any).error"
                      class="text-red-600"
                    >
                      {{ (itemNotices[value.item?.id ?? value.itemId!] as any).error }}
                    </span>
                  </div>
                </template>

                <!-- READY details -->
                <template v-if="itemNotices[value.item?.id ?? value.itemId!]?.kind === 'ready'">
                  <div class="mt-2 flex items-center gap-2">
                    <button
                      class="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
                      :disabled="(itemNotices[value.item?.id ?? value.itemId!] as any).accepting || (itemNotices[value.item?.id ?? value.itemId!] as any).accepted"
                      @click="create(itemNotices[value.item?.id ?? value.itemId!])"
                    >
                      {{
                        (itemNotices[value.item?.id ?? value.itemId!] as any).accepted
                          ? 'Подтверждено'
                          : (itemNotices[value.item?.id ?? value.itemId!] as any).accepting
                          ? 'Подтверждаем…'
                          : 'ОК — подтвердить перевод'
                      }}
                    </button>
                    <span
                      v-if="(itemNotices[value.item?.id ?? value.itemId!] as any).error"
                      class="text-red-600"
                    >
                      {{ (itemNotices[value.item?.id ?? value.itemId!] as any).error }}
                    </span>
                  </div>
                </template>

                <!-- INSUFFICIENT -->
                <template
                  v-if="itemNotices[value.item?.id ?? value.itemId!]?.kind === 'insufficient'"
                >
                  <!-- создаём локальный алиас n = itemNotices[key] -->
                  <template
                    v-for="n in [itemNotices[value.item?.id ?? value.itemId!] as any]"
                    :key="'ins-' + (value.item?.id ?? value.itemId)"
                  >
                    <div class="mt-1 text-[13px] text-gray-700">
                      <!-- 1) Есть детальная разбивка по компонентам -->
                      <template v-if="n.details?.missingComponents?.length">
                        <div class="mb-1">Не хватает компонентов:</div>
                        <ul class="list-disc pl-5">
                          <li v-for="m in n.details.missingComponents" :key="m.componentId">
                            {{ m.componentName }}
                            <!-- показываем формулу perUnit × needToCraft, если есть данные -->
                            <template v-if="m.perUnit && (n.details.needToCraft ?? 0) > 0">
                              — {{ m.perUnit }} × {{ n.details.needToCraft }} =
                              <b>{{ m.required }}</b>
                            </template>
                            <template v-else>
                              — нужно <b>{{ m.required }}</b>
                            </template>
                            <span class="text-gray-500"> (в наличии: {{ m.available }})</span>,
                            нехватает <b>{{ Math.max(0, m.lack ?? m.required - m.available) }}</b>
                          </li>
                        </ul>

                        <!-- агрегаты, чтобы было как на жёлтом кейсе -->
                        <div class="mt-2 text-[13px] text-gray-600">
                          К передаче: <b>{{ n.details.qtyRequested ?? value.qty }}</b> шт.
                          <span class="text-gray-500">
                            (готовых: {{ n.details.availableReady ?? 0 }}, крафт:
                            {{ n.details.needToCraft ?? 0 }})
                          </span>
                        </div>
                      </template>

                      <!-- 2) Детализации нет — фолбэк -->
                      <template v-else>
                        <div class="mb-1">Детализация по компонентам недоступна.</div>
                        <ul class="list-disc pl-5">
                          <li>
                            Запрошено: <b>{{ n.details?.qtyRequested ?? value.qty }}</b>
                          </li>
                          <li>
                            Готовых на складе: <b>{{ n.details?.availableReady ?? 0 }}</b>
                          </li>
                          <li>
                            Не хватает готового:
                            <b>{{
                              Math.max(
                                0,
                                (n.details?.qtyRequested ?? value.qty) -
                                  (n.details?.availableReady ?? 0),
                              )
                            }}</b>
                          </li>
                          <li v-if="(n.details?.needToCraft ?? 0) > 0">
                            Нужно скрафтить: <b>{{ n.details!.needToCraft }}</b>
                          </li>
                          <li v-else>Крафт недоступен или не требуется.</li>
                        </ul>
                      </template>
                    </div>

                    <!-- совет по уменьшению количества -->
                    <div v-if="n.suggestedQty" class="mt-2 flex items-center gap-2">
                      <span class="text-[13px] text-gray-700">
                        Совет: уменьшите количество до <b>{{ n.suggestedQty }}</b>
                      </span>
                      <button
                        class="rounded bg-gray-900 px-2 py-1 text-white text-xs"
                        @click="applySuggestion(value, n)"
                      >
                        Уменьшить и попробовать
                      </button>
                    </div>
                  </template>
                </template>

                <template
                  v-if="itemNotices[value.item?.id ?? value.itemId!]?.kind === 'insufficient'"
                >
                  <div class="mt-1 text-[13px] text-gray-700">
                    <template
                      v-if="getInsufficientView(itemNotices[value.item?.id ?? value.itemId!].details).items.length"
                    >
                      <div class="mb-1">Не хватает компонентов:</div>
                      <ul class="list-disc pl-5">
                        <li
                          v-for="m in getInsufficientView(itemNotices[value.item?.id ?? value.itemId!].details).items"
                          :key="m.componentId"
                        >
                          {{ m.componentName }}
                          <template
                            v-if="m.perUnit && getInsufficientView(itemNotices[value.item?.id ?? value.itemId!].details).missingToCraft"
                          >
                            — {{ m.perUnit }} ×
                            {{
                              getInsufficientView(
                                itemNotices[value.item?.id ?? value.itemId!].details,
                              ).missingToCraft
                            }}
                            = <b>{{ m.total ?? m.required }}</b>
                          </template>
                          <template v-else>
                            — нужно <b>{{ m.required ?? m.total }}</b>
                          </template>
                          <span class="text-gray-500"> (в наличии: {{ m.available ?? 0 }})</span>
                          <span v-if="m.lack !== undefined">, нехватает {{ m.lack }}</span>
                        </li>
                      </ul>
                    </template>

                    <!-- если вообще нет рецепта — покажем явную причину -->
                    <template v-else>
                      <div class="text-[13px]">
                        Для крафта нет рецепта или система не прислала детализацию.
                      </div>
                    </template>
                  </div>

                  <!-- совет по уменьшению количества -->
                  <div
                    v-if="itemNotices[value.item?.id ?? value.itemId!].suggestedQty"
                    class="mt-2 flex items-center gap-2"
                  >
                    <span class="text-[13px] text-gray-700">
                      Совет: уменьшите количество до
                      <b>{{ itemNotices[value.item?.id ?? value.itemId!].suggestedQty }}</b>
                    </span>
                    <button
                      class="rounded bg-gray-900 px-2 py-1 text-white text-xs"
                      @click="applySuggestion(value, itemNotices[value.item?.id ?? value.itemId!])"
                    >
                      Уменьшить и попробовать
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </template>
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
      <div class="transfer-preview">
        <div class="row-top">
          <span>Mike Johnson → John Doe</span>
          <Badge kind="pending">pending</Badge>
          <span class="">16.01.2024</span>
        </div>
        <div class="row-sub">3x Smartphone Assembly, 2x Laptop Kit</div>
      </div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>John Doe → Jane</span>
          <Badge kind="pending">pending</Badge>
          <span class="">16.01.2024</span>
        </div>
        <div class="row-sub">—</div>
      </div>
    </Card>
  </div>
</template>

<!-- # 1) Успех: передаю **2 телефона** (готового хватает, крафт не нужен)

**Запрос**

{
  "userFromId": "11111111-1111-1111-1111-111111111111",
  "userToId":   "22222222-2222-2222-2222-222222222222",
  "invItem":    "PHONE-001", 
  "qty":        2
}

**Ожидаемый ответ (201)**

{
  "ok": true,
  "status": "PENDING_READY",
  "message": "Транзакция создана (крафт не требуется)",
  "data": {
    "transaction": {
      "id": "55555555-5555-5555-5555-555555555555",
      "fromUserId": "11111111-1111-1111-1111-111111111111",
      "toUserId": "22222222-2222-2222-2222-222222222222",
      "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "units": 2,
      "status": "pending"
    },
    "plan": {
      "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "qtyRequested": 2,
      "transfer": { "direct": 2, "craft": 0 }
    }
  }
}


Контекст примера: у отправителя есть **2 готовых телефона** → всё уходит «как есть».

---
# 2) Крафт возможен: передаю **5 телефонов** (готово 2, докрафт 3 — комплектующие есть)

**Запрос**
{
  "userFromId": "11111111-1111-1111-1111-111111111111",
  "userToId":   "22222222-2222-2222-2222-222222222222",
  "invItem":    "PHONE-001",
  "qty":        5
}


**Ожидаемый ответ (201)**
{
  "ok": true,
  "status": "PENDING_CRAFTABLE",
  "message": "Транзакция создана (требуется крафт, но комплектующие есть)",
  "data": {
    "transaction": {
      "id": "66666666-6666-6666-6666-666666666666",
      "fromUserId": "11111111-1111-1111-1111-111111111111",
      "toUserId": "22222222-2222-2222-2222-222222222222",
      "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "units": 5,
      "status": "pending"
    },
    "plan": {
      "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "itemName": "Phone",
      "qtyRequested": 5,
      "transfer": { "direct": 2, "craft": 3 },
      "componentsToConsume": [
        {
          "componentId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          "componentName": "Screen",
          "perUnit": 1,
          "total": 3,
          "available": 10
        },
        {
          "componentId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
          "componentName": "Battery",
          "perUnit": 1,
          "total": 3,
          "available": 5
        },
        {
          "componentId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
          "componentName": "Main Board",
          "perUnit": 1,
          "total": 3,
          "available": 4
        }
      ]
    }
  }
}


Контекст примера: у отправителя **готово 2** телефона; рецепт телефона: `Screen x1`, `Battery x1`, `Main Board x1`. Для докрафта **3** ед. всё есть → создаётся pending-транзакция с планом списания компонентов при подтверждении.

---

# 3) Недостаточно и готового, и компонентов: передаю **7 телефонов** (готово 2, нужно докрафтить 5 — комплектующих не хватает)

**Запрос**
{
  "userFromId": "11111111-1111-1111-1111-111111111111",
  "userToId":   "22222222-2222-2222-2222-222222222222",
  "invItem":    "PHONE-001",
  "qty":        7
}

**Ожидаемый ответ (409)**

{
  "ok": false,
  "status": "INSUFFICIENT_STOCK_AND_COMPONENTS",
  "message": "Не достаточно товара, и не достаточно комплектующих для его крафта",
  "details": {
    "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "itemName": "Phone",
    "qtyRequested": 7,
    "availableReady": 2,
    "needToCraft": 5,
    "missingComponents": [
      {
        "componentId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "componentName": "Screen",
        "perUnit": 1,
        "required": 5,
        "available": 3,
        "lack": 2
      },
      {
        "componentId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "componentName": "Battery",
        "perUnit": 1,
        "required": 5,
        "available": 2,
        "lack": 3
      },
      {
        "componentId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "componentName": "Main Board",
        "perUnit": 1,
        "required": 5,
        "available": 4,
        "lack": 1
      }
    ]
  }
}


> Контекст примера: готово **2**, нужно докрафтить **5**, но по ряду компонентов нехватка — API возвращает 409 с детальным списком дефицитов. -->
