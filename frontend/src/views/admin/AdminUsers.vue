<script setup lang="ts">
import { onMounted, reactive, computed } from 'vue';
import {Eraser, Package} from 'lucide-vue-next';
import RowCard from '../../components/RowCard.vue';
import IconBtn from '../../components/IconBtn.vue';
import Button from '../../components/Button.vue';
import SearchList from '../../components/SearchList.vue';
import UserModal from '../../components/modal/UserModal.vue';
import GiveGoodsModal from '../../components/modal/GiveGoodsModal.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import LoadingList from '../../components/common/LoadingList.vue';

import { useUsers } from '../../stores/user';
import { useAuth } from '../../stores/auth';
import { useTrans } from '../../stores/transfer';
import { useItem } from '../../stores';
import { useAction } from '../../composables/useAction';
import { useBusySet } from '../../composables/useBusySet';

import type { User } from '../../types/domain';
import type { UserDTO } from '../../types/DTO';
import { useRoles } from '../../stores/roles';

type Role = { id: string; name: string };

const usersStore = useUsers();
const auth = useAuth();
const trans = useTrans();
const item = useItem();
const { act } = useAction();
const busy = useBusySet();
const rolesStore = useRoles();
const roles = computed<Role[]>(() => rolesStore.roles as any);

const state = reactive({
  openUserModal: false,
  editUser: null as User | null,
  openGive: false,
  giveToUser: null as User | null,
});

onMounted(async () => {
  try {
    // load users (no client-side limit by default)
    usersStore.getUser?.(false);
    if (!auth.users) await auth.me();
    if (!item.items) await item.fetchItems();
    // roles приходят из bootstrap; если их нет — можно реализовать догрузку через apiClient при желании
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
  const fromId = auth.users?.id || '';

  if (!fromId) {
    // подсказка пользователю + не слать битый запрос
    return act(() => Promise.reject(new Error('Не удалось определить отправителя')), {
      messages: { error: 'Вы не авторизованы или не получены данные профиля' },
      ok: () => false,
    });
  }

  const toId = String(state.giveToUser?.id ?? '');
  const res = await act(() => trans.create(fromId, toId, payload.items, null, { force: true }), {
    messages: {
      success: 'Передача создана',
      error: trans.error ?? 'Не удалось выполнить передачу',
    },
    ok: (x: any) => !!x?.ok,
  });

  if (res?.ok) {
    state.openGive = false;
    state.giveToUser = null;
  }
}
</script>

<template>
  <div>
    <Button variant="primary" :full="true" class="" @click="onOpenCreate">＋ Добавить нового пользователя</Button>

    <SearchList :items="usersStore.users ?? []" :loading="usersStore.loading" placeholder="Поиск по имени или телефону" :filterKeys="['name','phone']">
      <template #loading>
        <LoadingList />
      </template>
      <template #default="{ items }">
        <EmptyState v-if="!usersStore.loading && !items.length" text="Пользователей пока нет" />
        <template v-else>
          <RowCard
            v-for="u in items"
            :key="u.id"
            :title="u.name"
            :subtitle="u.phone ? `📞 ${u.phone}` : '—'"
            :badge="{ text: u.role?.name ?? '—' }"
          >
            <template #avatar>👤</template>
            <template #actions>
              <IconBtn title="Выдать товары" @click="openGive(u)"><Package :size="16" color="#333333" /></IconBtn>
              <IconBtn title="Редактировать" @click="onOpenEdit(u)"><Eraser :size="16" color="#333333" /></IconBtn>
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
        </template>
      </template>
    </SearchList>
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
