<script setup lang="ts">
import Card from "../../components/Card.vue";
import Badge from "../../components/Badge.vue";
import { useUsers } from "../../stores/user";
import { onBeforeMount, onBeforeUnmount, onMounted } from "vue";
import { deliteUser } from "../../utils/usersApi";
const ac = new AbortController()
const users = useUsers()

onMounted(() => {
  users.fetchUsers(ac.signal);
  console.log(users)
})

onBeforeUnmount(() => ac.abort())


const onSubmit = async (id: string) => {
  if (!confirm("Are you sure?")) {
    return
  }
  try {
    const result = await deliteUser(id)
    alert(result.message || 'Пользователь деактивирован')
  } catch (error) {

    alert('front error')
  }
}

type UserRow = {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "manager" | "user" | "";
  you?: boolean;
};
// const users: UserRow[] = [
//   { id: "1", name: "John Doe", phone: "+1234567890", role: "admin", you: true },
//   { id: "2", name: "Jane Smith", phone: "+0987654321", role: "manager" },
//   { id: "3", name: "Mike Johnson", phone: "+1122334455", role: "user" },
// ];
</script>

<template>
  <div>
    <Card v-for="u in users.users" :key="u.id" class="user-card" padded>
      <div class="user-row">
        <div class="left">
          <div class="avatar">👤</div>
          <div>
            <div class="name">
              {{ u.name }}
              <Badge v-if="u.role" kind="muted">{{ u.role }}</Badge>
              <!-- <Badge v-if="u.you" kind="muted">You</Badge> -->
            </div>
            <div class="muted">📞 {{ u.phone }}</div>
          </div>
        </div>
        <div class="right">
          <button class="icon-btn ghost" title="Edit">✎</button>
          <button @click="onSubmit(u.id)" class="icon-btn danger" title="Delete">🗑</button>
        </div>
      </div>
    </Card>
  </div>
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
