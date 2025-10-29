<script setup>
import Cart from './Card.vue';
import Badge from './Badge.vue';
</script>
<template>
  <Card class="user-card" padded>
    <div class="user-row">
      <div class="left">
        <div class="avatar">👤</div>
        <div>
          <div class="name">
            {{ u.name }}
            <Badge kind="">{{ u.role.name }}</Badge>
          </div>
          <div class="">📞 {{ u.phone }}</div>
        </div>
      </div>

      <div class="right">
        <button class="icon-btn ghost" title="Выдать товары" @click="openGive(u)">📦</button>
        <button class="icon-btn ghost" title="Редактировать" @click="onOpenEdit(u)">✎</button>
        <button class="icon-btn danger" title="Удалить" @click="deleteUser(u.id)">🗑</button>
      </div>
    </div>
  </Card>
</template>
