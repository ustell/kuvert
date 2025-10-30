<!-- <script setup lang="ts">
// placeholder
</script>

<template>
  <div />
</template>
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

                <template
                  v-if="itemNotices[value.item?.id ?? value.itemId!]?.kind === 'insufficient'"
                >
                  <template
                    v-for="n in [itemNotices[value.item?.id ?? value.itemId!] as any]"
                    :key="'ins-' + (value.item?.id ?? value.itemId)"
                  >
                    <div class="mt-1 text-[13px] text-gray-700">
                      <template v-if="n.details?.missingComponents?.length">
                        <div class="mb-1">Не хватает компонентов:</div>
                        <ul class="list-disc pl-5">
                          <li v-for="m in n.details.missingComponents" :key="m.componentId">
                            {{ m.componentName }}

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

                        <div class="mt-2 text-[13px] text-gray-600">
                          К передаче: <b>{{ n.details.qtyRequested ?? value.qty }}</b> шт.
                          <span class="text-gray-500">
                            (готовых: {{ n.details.availableReady ?? 0 }}, крафт:
                            {{ n.details.needToCraft ?? 0 }})
                          </span>
                        </div>
                      </template>

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

                    <template v-else>
                      <div class="text-[13px]">
                        Для крафта нет рецепта или система не прислала детализацию.
                      </div>
                    </template>
                  </div>

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
        <div class="empty-ic">📦 </div>
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

**Запрос** { "userFromId": "11111111-1111-1111-1111-111111111111", "userToId":
"22222222-2222-2222-2222-222222222222", "invItem": "PHONE-001", "qty": 2 } **Ожидаемый ответ (201)**
{ "ok": true, "status": "PENDING_READY", "message": "Транзакция создана (крафт не требуется)",
"data": { "transaction": { "id": "55555555-5555-5555-5555-555555555555", "fromUserId":
"11111111-1111-1111-1111-111111111111", "toUserId": "22222222-2222-2222-2222-222222222222",
"itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "units": 2, "status": "pending" }, "plan": {
"itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "qtyRequested": 2, "transfer": { "direct": 2,
"craft": 0 } } } } Контекст примера: у отправителя есть **2 готовых телефона** → всё уходит «как
есть». --- # 2) Крафт возможен: передаю **5 телефонов** (готово 2, докрафт 3 — комплектующие есть)
**Запрос** { "userFromId": "11111111-1111-1111-1111-111111111111", "userToId":
"22222222-2222-2222-2222-222222222222", "invItem": "PHONE-001", "qty": 5 } **Ожидаемый ответ (201)**
{ "ok": true, "status": "PENDING_CRAFTABLE", "message": "Транзакция создана (требуется крафт, но
комплектующие есть)", "data": { "transaction": { "id": "66666666-6666-6666-6666-666666666666",
"fromUserId": "11111111-1111-1111-1111-111111111111", "toUserId":
"22222222-2222-2222-2222-222222222222", "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "units":
5, "status": "pending" }, "plan": { "itemId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "itemName":
"Phone", "qtyRequested": 5, "transfer": { "direct": 2, "craft": 3 }, "componentsToConsume": [ {
"componentId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "componentName": "Screen", "perUnit": 1,
"total": 3, "available": 10 }, { "componentId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
"componentName": "Battery", "perUnit": 1, "total": 3, "available": 5 }, { "componentId":
"dddddddd-dddd-dddd-dddd-dddddddddddd", "componentName": "Main Board", "perUnit": 1, "total": 3,
"available": 4 } ] } } } Контекст примера: у отправителя **готово 2** телефона; рецепт телефона:
`Screen x1`, `Battery x1`, `Main Board x1`. Для докрафта **3** ед. всё есть → создаётся
pending-транзакция с планом списания компонентов при подтверждении. --- # 3) Недостаточно и
готового, и компонентов: передаю **7 телефонов** (готово 2, нужно докрафтить 5 — комплектующих не
хватает) **Запрос** { "userFromId": "11111111-1111-1111-1111-111111111111", "userToId":
"22222222-2222-2222-2222-222222222222", "invItem": "PHONE-001", "qty": 7 } **Ожидаемый ответ (409)**
{ "ok": false, "status": "INSUFFICIENT_STOCK_AND_COMPONENTS", "message": "Не достаточно товара, и не
достаточно комплектующих для его крафта", "details": { "itemId":
"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "itemName": "Phone", "qtyRequested": 7, "availableReady": 2,
"needToCraft": 5, "missingComponents": [ { "componentId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
"componentName": "Screen", "perUnit": 1, "required": 5, "available": 3, "lack": 2 }, {
"componentId": "cccccccc-cccc-cccc-cccc-cccccccccccc", "componentName": "Battery", "perUnit": 1,
"required": 5, "available": 2, "lack": 3 }, { "componentId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
"componentName": "Main Board", "perUnit": 1, "required": 5, "available": 4, "lack": 1 } ] } } >
Контекст примера: готово **2**, нужно докрафтить **5**, но по ряду компонентов нехватка — API
возвращает 409 с детальным списком дефицитов. -->
-->
