<script setup lang="ts">
import LoadingList from '../components/common/LoadingList.vue';
import IncomingTransferCard from '../components/transfer/IncomingTransferCard.vue';

import { onMounted, onBeforeUnmount, computed } from 'vue';
import { useTrans } from '../stores/transfer';
import { useAuth } from '../stores';
import { useAction } from '../composables/useAction';
import { useBusySet } from '../composables/useBusySet';
import { useFormat } from '../composables/useFormat';
import { useNotify } from '../stores/notify';

const trans = useTrans();
const auth = useAuth();
const notify = useNotify();
const { act } = useAction();
const busy = useBusySet();
const fmt = useFormat('ru-RU');

const abortCtl = new AbortController();
const uid = computed(() => auth.users?.id ?? null);
const items = computed(() => trans.transfer ?? []);
const incomingPending = computed(() =>
  items.value.filter(
    (t) =>
      String(t.toUser?.id ?? t.toUserId) === String(uid.value) && String(t.status) === 'pending',
  ),
);

const load = async () => {
  const id = String(uid.value || '');
  await act(() => trans.fetchItems({ reset: true, mine: 'to', userId: id, status: 'all', signal: abortCtl.signal }), {
    messages: { error: trans.error ?? 'Не удалось загрузить переводы' },
  });
};

const accept = (id: string) =>
  busy.wrap(id, async () => {
    const r = await act(() => trans.accept(id, uid.value!), {
      messages: { success: 'Перевод подтверждён', error: 'Не удалось подтвердить' },
      ok: (x: any) => x?.ok !== false,
    });
    // `trans.accept` already updates local state and triggers related refreshes
    // (auth.me and items.fetchItems) internally. Avoid double-fetch here to
    // prevent extra re-renders / flicker.
    if (!(r as any)?.ok) notify.error(trans.error ?? 'Не удалось подтвердить');
    else notify.success('Подтверждено');
  });

const reject = (id: string) =>
  busy.wrap(id, async () => {
    const r = await act(() => trans.reject(id, uid.value!), {
      messages: { success: 'Перевод отклонён', error: 'Не удалось отклонить' },
      ok: (x: any) => x?.ok !== false,
    });
    // `trans.reject` already updates local state and triggers related refreshes
    // internally. Avoid duplicate refresh to prevent UI flicker.
    if (!(r as any)?.ok) notify.error(trans.error ?? 'Не удалось отклонить');
    else notify.info('Отклонено');
  });

onMounted(load);
onBeforeUnmount(() => abortCtl.abort());
</script>

<template>
  <div class="container">
    <div class="page-head mb-2">
      <div class="title-18">Подтверждение переводов</div>
      <div>Проверьте входящие переводы</div>
    </div>

    <LoadingList v-if="trans.loading && !trans.transfer" :rows="3" />
    <div v-else-if="!incomingPending.length" class="empty">Входящих переводов нет.</div>

    <IncomingTransferCard
      v-for="v in incomingPending"
      :key="v.id"
      :value="v"
      :busy="busy.has(v.id)"
      :format-date="fmt.date"
      :format-units="fmt.units"
      @accept="accept(v.id)"
      @reject="reject(v.id)"
    />
  </div>
</template>

<style scoped>
.empty {
  padding: 16px 8px;
}
</style>
