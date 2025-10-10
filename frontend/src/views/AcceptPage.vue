<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Accept Transfers</div>
      <div class="muted">Review and approve incoming transfers</div>
    </div>

    <Card padded>
      <div class="row-between">
        <div class="title-16">Pending Transfers</div>
        <span class="chip">1 waiting</span>
      </div>
    </Card>

    <Card padded>
      <div class="row-between mb8">
        <div class="title-16">Transfer #2</div>
        <Badge kind="pending">pending</Badge>
      </div>
      <div class="muted mb12">From: Mike Johnson • 16.01.2024</div>

      <ListItem>
        <template #default>Smartphone Assembly</template>
        <template #right><span class="pill">3 units</span></template>
      </ListItem>
      <ListItem>
        <template #default>Laptop Kit</template>
        <template #right><span class="pill">2 units</span></template>
      </ListItem>

      <div class="btn-row">
        <Button variant="primary">✓ Accept</Button>
        <Button variant="danger">✕ Reject</Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from '../components/Card.vue';
import Badge from '../components/Badge.vue';
import Button from '../components/Button.vue';
import ListItem from '../components/ListItem.vue';
</script>
