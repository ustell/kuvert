<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Create Transfer</div>
      <div class="muted">Transfer goods between users</div>
    </div>

    <Card padded>
      <div class="card-title">Transfer Details</div>
      <label class="label">From User</label>
      <div class="field disabled">
        <span class="placeholder">Select sender</span
        ><span class="chev">▾</span>
      </div>

      <label class="label mt12">To User</label>
      <div class="field disabled">
        <span class="placeholder">Select recipient</span
        ><span class="chev">▾</span>
      </div>
    </Card>

    <Card padded>
      <div class="row-between">
        <div class="card-title">Items to Transfer</div>
        <Button variant="soft">＋ Add Item</Button>
      </div>

      <div class="empty">
        <div class="empty-ic">📦</div>
        <div class="muted">No items added yet</div>
        <div class="muted small">Click "Add Item" to get started</div>
      </div>
    </Card>

    <Button variant="primary" :full="true" style="margin-top: 12px"
      >✈ Create Transfer</Button
    >

    <Card padded>
      <div class="card-title">Recent Transfers</div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>Mike Johnson → John Doe</span>
          <Badge kind="pending">pending</Badge>
          <span class="muted">16.01.2024</span>
        </div>
        <div class="row-sub muted">3x Smartphone Assembly, 2x Laptop Kit</div>
      </div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>John Doe → Jane</span>
          <Badge kind="pending">pending</Badge>
          <span class="muted">16.01.2024</span>
        </div>
        <div class="row-sub muted">—</div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from "../components/Card.vue";
import Badge from "../components/Badge.vue";
import Button from "../components/Button.vue";
</script>
