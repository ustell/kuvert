<script setup lang="ts">
import { Card, Badge, Button, Options } from '../components';
import { SelectItem } from '../components/ui/select';
import { useUsers, useAuth } from '../stores';
import { reactive, ref } from 'vue';
import type { Inventory } from '../types/domain';
import TransferModal from '../components/modal/TransferModal.vue';

const users = useAuth().users;
const allUser = useUsers().users;
const state = reactive<{
  open: boolean;
  userInv: Inventory[] & { qty: number };
}>({
  open: false,
  userInv: [],
});

const onSelectItem = (i: Inventory) => {
  state.userInv.push({ ...i, qty: 1 });
};
const inc = (i: Inventory) => {
  if (i.units > i.qty) {
    i.qty++;
  }
};
const dec = (i: Inventory) => {
  if (i.qty > 1) {
    i.qty--;
  }
};
const onSave = () => {
  console.log('user');
};
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Создать передачу</div>
      <div class="muted">Transfer goods between users</div>
    </div>
    <pre>{{ users }}</pre>
    <Card padded>
      <div class="card-title">Transfer Details</div>
      <label class="label">From User</label>
      <div class="field disabled">
        <span class="placeholder">Текущий пользователь: {{ users?.name }}</span
        ><span class="chev">▾</span>
      </div>
      <label class="label mt12">To User</label>
      <div class="field disabled">
        <Options v-if="users">
          <SelectItem
            v-for="v in allUser"
            :value="v.name"
            class="px-3 py-2 cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          >
            <p>{{ v.name }}</p>
          </SelectItem>
        </Options>
      </div>
    </Card>
    <Card padded>
      <div class="row-between">
        <div class="card-title">Items to Transfer</div>
        <Button variant="soft" @click="state.open = true">＋ Add Item</Button>
      </div>
      <template v-if="state.userInv">
        <div v-for="value in state.userInv" :key="value.id ?? value.item?.id" class="flex mb-4">
          <div class="flex gap-3">
            <p>{{ value.item.name }}</p>
            <button @click="dec(value)">-</button>
            <input
              type="number"
              :value="value.qty"
              :placeholder="value.units"
              class="w-10 border-1"
            />
            <button @click="inc(value)">+</button>
          </div>
        </div>
      </template>
      <div v-else class="empty">
        <div class="empty-ic">📦</div>
        <div>No items added yet</div>
        <div class="small">Click "Add Item" to get started</div>
      </div>
    </Card>
    <TransferModal
      v-model="state.open"
      title="Проверить позиции"
      :userInv="users?.inventories"
      @select="onSelectItem"
    />

    <Button variant="primary" :full="true" style="margin-top: 12px">✈ Create Transfer</Button>
    <Card padded>
      <div class="card-title">Recent Transfers</div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>Mike Johnson → John Doe</span>
          <Badge kind="pending">pending</Badge>
          <span class="">16.01.2024</span>
        </div>
        <div class="row-sub">3x Smartphone Assembly, 2x Laptop Kit</div>
      </div>
      <div class="transfer-preview">
        <div class="row-top">
          <span>John Doe → Jane</span>
          <Badge kind="pending">pending</Badge>
          <span class="">16.01.2024</span>
        </div>
        <div class="row-sub">—</div>
      </div>
    </Card>
  </div>
</template>
