<template>
    <section class="card">
        <div class="h1">Admin Settings</div>
        <div class="sub">Manage users and goods</div>
    </section>

    <section class="card mt16">
        <div class="segment">
            <button :class="{ active: tab === 'users' }" @click="tab = 'users'">Users</button>
            <button :class="{ active: tab === 'goods' }" @click="tab = 'goods'">Goods</button>
        </div>

        <button class="btn full" style="margin-top:12px;background:#0b0f1f;color:#fff;border-color:#0b0f1f">＋ Add New
            User</button>
    </section>

    <section v-if="tab === 'users'" class="card mt16">
        <div class="list">
            <UserCard name="John Doe" role="admin" :you="true" phone="+1234567890" />
            <UserCard name="Jane Smith" role="manager" phone="+0987654321" />
            <UserCard name="Mike Johnson" role="user" phone="+1122334455" />
        </div>
    </section>

    <section v-else class="card mt16">
        <div class="list">
            <div class="list-item">
                <div class="row">
                    <div class="icon">⬢</div>
                    <div>Smartphone Assembly</div>
                </div>
                <span class="badge">25 units</span>
            </div>
            <div class="list-item">
                <div class="row">
                    <div class="icon">⬢</div>
                    <div>Laptop Kit</div>
                </div>
                <span class="badge">12 units</span>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref } from 'vue'
import UserCard from '../components/UserCard.vue'
const tab = ref('users')
</script>


<style>
.list-item {
    display: flex;
    justify-content: space-between;
}

.segment {
    display: flex;
    justify-content: space-between;

}

.segment>button {
    outline: none;
    border: none;
    background: none;
    width: 300px;
    font-size: 24px;
}
</style>