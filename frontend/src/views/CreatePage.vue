<template>
    <section class="card">
        <div class="h1">Create Transfer</div>
        <div class="sub">Transfer goods between users</div>
    </section>

    <section class="card mt16">
        <label class="caption">From User</label>
        <select class="input" v-model="fromUser">
            <option value="">Select sender</option>
            <option>Mike Johnson</option>
            <option>Jane Smith</option>
        </select>

        <div style="height:10px"></div>

        <label class="caption">To User</label>
        <select class="input" v-model="toUser">
            <option value="">Select recipient</option>
            <option>John Doe</option>
            <option>Mike Johnson</option>
        </select>
    </section>

    <section class="card mt16">
        <div class="space">
            <strong>Items to Transfer</strong>
            <button class="btn small" @click="addItem">＋ Add Item</button>
        </div>

        <div v-if="items.length === 0" class="empty mt16">
        </div>

        <div v-else class="list mt16">
            <div v-for="(it, idx) in items" :key="idx" class="list-item space">
                <div class="row">
                    <select class="input" v-model="it.name">
                        <option>Smartphone Assembly</option>
                        <option>Laptop Kit</option>
                    </select>
                </div>
                <input class="input" v-model.number="it.units" type="number" min="1" style="width:90px;height:36px" />
            </div>
        </div>
    </section>

    <button class="btn primary full" style="margin-top:14px;height:46px">🛰 Create Transfer</button>

    <section class="card mt16">
        <div class="h1">Recent Transfers</div>
        <div class="list mt8">
            <TransferItem from="Mike Johnson → John Doe" status="pending"
                details="3x Smartphone Assembly, 2x Laptop Kit" date="16.01.2024" />
        </div>
    </section>
</template>

<script setup>
import { ref } from 'vue'
import TransferItem from '../components/TransferItem.vue'

const fromUser = ref('')
const toUser = ref('')
const items = ref([])

function addItem() {
    items.value.push({ name: 'Smartphone Assembly', units: 1 })
}
</script>
