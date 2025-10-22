<script setup lang="ts">
import Card from '../../components/Card.vue';
import Badge from '../../components/Badge.vue';
import { useUsers } from '../../stores/user';
import { onMounted, reactive, ref } from 'vue';
import Button from '../../components/Button.vue';
import UserModal from '../../components/modal/UserModal.vue';
import type { Result, User } from '../../types/domain';
import { useAuth } from '../../stores/auth';
import type { UserDTO } from '../../types/DTO';

const store = useUsers();
onMounted(() => {
  store.getUser();
});

const state = reactive<{
  error: string;
  open: boolean;
  currentUser: User | null;
}>({
  error: '',
  open: false,
  currentUser: null,
});

const onEdit = (user: User) => {
  state.currentUser = user;
  state.open = true;
};
const onOpen = () => {
  state.currentUser = null;
  state.open = true;
};

async function deleteUser(user: string) {
  state.error = '';
  try {
    const ok = await store.delete(user);
    if (!ok) {
      state.error = store.error ?? 'Не удалось удалить пользователя';
      console.warn('Delete returned false for user:', user, 'store.error=', store.error);
      setTimeout(() => (state.error = ''), 3000);
      return false;
    }
    console.log('Пользователь удалён:', user);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.error = msg || 'Ошибка при удалении пользователя';
    console.error('deleteUser error:', msg);
    setTimeout(() => (state.error = ''), 3000);
    return false;
  }
}
async function updateUser({ name, phone, password, id }: UserDTO) {
  state.error = '';
  try {
    const ok = await store.update({ name, phone, password, id });
    if (!ok) {
      state.error = store.error ?? 'Не удалось создать пользователя';
      console.warn('Update returned false for user:', name, 'store.error=', store.error);
      setTimeout(() => (state.error = ''), 3000);
      return false;
    }
    console.log('Пользователь создан:', name);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.error = msg || 'Ошибка при удалении пользователя';
    console.error('deleteUser error:', msg);
    setTimeout(() => (state.error = ''), 3000);
    return false;
  }
}
async function createUser({ name, phone, password }: UserDTO) {
  state.error = '';
  try {
    const ok = await store.create({ name, phone, password }, true);
    if (!ok) {
      state.error = store.error ?? 'Не удалось создать пользователя';
      console.warn('Create returned false for user:', name, 'store.error=', store.error);
      setTimeout(() => (state.error = ''), 3000);
      return false;
    }
    console.log('Пользователь создан:', name);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.error = msg || 'Ошибка при удалении пользователя';
    console.error('deleteUser error:', msg);
    setTimeout(() => (state.error = ''), 3000);
    return false;
  }
}
</script>

<template>
  <div>
    <p v-if="state.error.length > 1">{{ state.error }}</p>
    <Button variant="primary" :full="true" class="mt12" @click="onOpen">
      ＋ Добавить нового пользователя
    </Button>

    <Card class="user-card" v-for="u in store.users" padded>
      <div class="user-row">
        <div class="left">
          <div class="avatar">👤</div>
          <div>
            <div class="name">
              {{ u.name }}
              <Badge kind="muted">{{ u.roleId?.toString().slice(9, 10) }}</Badge>
            </div>
            <div class="muted">📞 Phone {{ u.phone }}</div>
          </div>
        </div>
        <div class="right">
          <button class="icon-btn ghost" title="Edit" @click="onEdit(u)">✎</button>
          <button class="icon-btn danger" title="Delete" @click="deleteUser(u.id)">🗑</button>
        </div>
      </div>
    </Card>
  </div>

  <UserModal
    v-model="state.open"
    title="Пользователь"
    :current-user="state.currentUser"
    @create="createUser"
    @update="updateUser"
  />
</template>

<style scoped>
.user-card {
  padding: 12px;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #f5f7ff;
  border: 1px solid var(--line);
}

.name {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
}

.right {
  display: flex;
  gap: 8px;
}

.icon-btn {
  appearance: none;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.icon-btn.ghost {
  background: #fff;
}

.icon-btn.danger {
  background: #fff5f5;
  border-color: #ffd7d7;
  color: #c02626;
}
</style>
