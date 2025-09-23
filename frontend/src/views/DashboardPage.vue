<script setup>

import { onMounted } from 'vue';
import { useAuth } from '../stores/auth';
const auth = useAuth()

onMounted(() => {
    auth.hydrate()
})
</script>


<template>
    <section class="card">
        <div class="h1">Welcome back, {{ auth.user?.name }}</div>
        <div class="sub">Production Tracking Dashboard</div>
    </section>

    <div class="grid2 mt16">
        <StatCard title="Pending Transfers" :value="1" subtitle="Awaiting your approval" />
        <StatCard title="Total Items" :value="37" subtitle="In your inventory" />
    </div>

    <section class="card mt16">
        <div class="h1">Recent Transfers to You</div>
        <div class="list mt8">
            <TransferItem from="Mike Johnson" status="pending" details="3x Smartphone Assembly, 2x Laptop Kit"
                date="16.01.2024" />
        </div>
    </section>

    <section class="card mt16">
        <div class="h1">My Inventory</div>
        <div class="list mt8">
            <InventoryItem name="Smartphone Assembly" :units="25" />
            <InventoryItem name="Laptop Kit" :units="12" />
        </div>
    </section>
</template>
