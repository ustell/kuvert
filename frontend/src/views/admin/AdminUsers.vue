<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import RowCard from '../../components/RowCard.vue';
import IconBtn from '../../components/IconBtn.vue';
import Button from '../../components/Button.vue';
import UserModal from '../../components/modal/UserModal.vue';
import GiveGoodsModal from '../../components/modal/GiveGoodsModal.vue';
import EmptyState from '../../components/common/EmptyState.vue';

import { useUsers } from '../../stores/user';
import { useAuth } from '../../stores/auth';
import { useTrans } from '../../stores/transfer';
import { useItem } from '../../stores';
import { useAction } from '../../composables/useAction';
import { useBusySet } from '../../composables/useBusySet';

import type { User } from '../../types/domain';
import type { UserDTO } from '../../types/DTO';
import http from '../../libs/http';

type Role = { id: string; name: string };

const usersStore = useUsers();
const auth = useAuth();
const trans = useTrans();
const item = useItem();
const { act } = useAction();
const busy = useBusySet();
const roles = ref<Role[]>([]);

const state = reactive({
  openUserModal: false,
  editUser: null as User | null,
  openGive: false,
  giveToUser: null as User | null,
});

onMounted(async () => {
  try {
    usersStore.getUser?.();
    if (!auth.users) await auth.me();
    if (!item.items) await item.fetchItems();
    const res = await http<Role[]>('GET', '/api/auth/roles');
    if (res.ok) roles.value = res.data;
  } catch (e) {
    console.error(e);
  }
});

const onOpenCreate = () => {
  state.editUser = null;
  state.openUserModal = true;
};
const onOpenEdit = (u: User) => {
  state.editUser = u;
  state.openUserModal = true;
};

async function deleteUser(id: string) {
  await busy.wrap(id, () =>
    act(() => usersStore.delete(id), {
      messages: {
        success: 'Пользователь удалён',
        error: usersStore.error ?? 'Не удалось удалить пользователя',
      },
      ok: (r: any) => r === true,
    }),
  );
}
async function updateUser(p: UserDTO) {
  await act(() => usersStore.update(p, true), {
    messages: {
      success: 'Пользователь обновлён',
      error: usersStore.error ?? 'Не удалось обновить пользователя',
    },
    ok: (r: any) => r === true,
  });
  state.openUserModal = false;
  state.editUser = null;
}
async function createUser(p: UserDTO) {
  await act(() => usersStore.create(p, true), {
    messages: {
      success: 'Пользователь создан',
      error: usersStore.error ?? 'Не удалось создать пользователя',
    },
    ok: (r: any) => r === true,
  });
  state.openUserModal = false;
}

function openGive(u: User) {
  state.giveToUser = u;
  state.openGive = true;
}
async function onConfirmGive(payload: { items: Array<{ itemId: string; qty: number }> }) {
  const fromId = String(auth.users?.id ?? '');
  const toId = String(state.giveToUser?.id ?? '');
  const res = await act(() => trans.create(fromId, toId, payload.items, null, { force: true }), {
    messages: {
      success: 'Передача создана',
      error: trans.error ?? 'Не удалось выполнить передачу',
    },
    ok: (x: any) => !!x?.ok,
  });
  if ((res as any)?.ok) {
    state.openGive = false;
    state.giveToUser = null;
  }
}
</script>

<template>
  <div>
    <Button variant="primary" :full="true" class="mt12" @click="onOpenCreate"
      >＋ Добавить нового пользователя</Button
    >
    <EmptyState v-if="!usersStore.users?.length" text="Пользователей пока нет" />
    <RowCard
      v-for="u in usersStore.users"
      :key="u.id"
      :title="u.name"
      :subtitle="u.phone ? `📞 ${u.phone}` : '—'"
      :badge="{ text: u.role?.name ?? '—' }"
    >
      <template #avatar>👤</template>
      <template #actions>
        <IconBtn title="Выдать товары" @click="openGive(u)">📦</IconBtn>
        <IconBtn title="Редактировать" @click="onOpenEdit(u)">✎</IconBtn>
        <IconBtn
          :disabled="busy.has(u.id)"
          variant="danger"
          title="Удалить"
          @click="deleteUser(u.id)"
        >
          <template v-if="busy.has(u.id)">⏳</template><template v-else>🗑</template>
        </IconBtn>
      </template>
    </RowCard>
  </div>

  <UserModal
    v-model="state.openUserModal"
    title="Пользователь"
    :current-user="state.editUser"
    :roles="roles"
    @create="createUser"
    @update="updateUser"
  />
  <GiveGoodsModal
    v-model="state.openGive"
    :to-user="state.giveToUser"
    :items="item.items"
    @confirm="onConfirmGive"
  />
</template>
