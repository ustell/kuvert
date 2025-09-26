<script setup lang="ts">
import { onMounted, ref } from "vue";
import Button from "../components/Button.vue";
import AdminUsers from "./admin/AdminUsers.vue";
import AdminGoods from "./admin/AdminGoods.vue";

const tab = ref<"users" | "goods">("users");
</script>


<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Admin Settings</div>
      <div class="muted">Manage users and goods</div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'users' }" @click="tab = 'users'">
        👥 Users
      </button>
      <button class="tab" :class="{ active: tab === 'goods' }" @click="tab = 'goods'">
        📦 Goods
      </button>
    </div>

    <!-- Add button -->
    <Button variant="primary" :full="true" class="mt12">
      <template v-if="tab === 'users'">＋ Add New User</template>
      <template v-else>＋ Add New Good</template>
    </Button>

    <component :is="tab === 'users' ? AdminUsers : AdminGoods" class="mt12" />
  </div>
</template>


<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  background: #f3f4f7;
  border: 1px solid var(--line);
  padding: 6px;
  border-radius: 999px;
  margin-top: 12px;
}

.tab {
  flex: 1;
  appearance: none;
  border: none;
  background: transparent;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 700;
  color: #2a2f3a;
  cursor: pointer;
}

.tab.active {
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}
</style>
