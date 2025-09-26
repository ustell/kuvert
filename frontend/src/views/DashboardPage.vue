<script setup lang="ts">
import Card from "../components/Card.vue";
import Badge from "../components/Badge.vue";
import ListItem from "../components/ListItem.vue";
import { useAuth } from "../stores/auth";

const auth = useAuth()

</script>


<template>
  <div class="container">
    <div class="welcome">
      <div class="muted">Welcome back, <b>{{ auth.user?.name }}</b></div>
      <div class="title">Production Tracking Dashboard</div>
    </div>

    <div class="grid-2">
      <Card padded>
        <div class="stat">
          <div class="stat-ic">⏱️</div>
          <div class="stat-num">1</div>
          <div class="stat-sub">Awaiting your approval</div>
        </div>
      </Card>
      <Card padded>
        <div class="stat">
          <div class="stat-ic">📦</div>
          <div class="stat-num">27</div>
          <div class="stat-sub">In your inventory</div>
        </div>
      </Card>
    </div>

    <Card padded>
      <div class="card-title">Recent Transfers to You</div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>From: Mike Johnson</span>
          <Badge kind="pending">pending</Badge>
          <span class="muted">16.01.2024</span>
        </div>
        <div class="row-sub muted">3x Smartphone Assembly, 2x Laptop Kit</div>
      </div>
    </Card>

    <Card padded>
      <div class="card-title">My Inventory</div>
      <ListItem>
        <template #default>Smartphone Assembly, ▼</template>
        <template #right>
          <span class="pill">25 units</span>
        </template>
      </ListItem>
      <ListItem>
        <template #default>Laptop Kit</template>
        <template #right>
          <span class="pill">12 units</span>
        </template>
      </ListItem>
    </Card>
  </div>
</template>
