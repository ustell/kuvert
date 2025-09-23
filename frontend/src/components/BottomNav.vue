<template>
    <nav class="bottom-nav" role="navigation" aria-label="Главная навигация">
        <div class="wrap">
            <RouterLink class="tab" :class="{ active: is('/dashboard') }" to="/">
                <LayoutDashboard size="18" aria-hidden="true" />
                <span>Главная</span>
            </RouterLink>
            <RouterLink class="tab" :class="{ active: is('/accept') }" to="/accept">
                <ArrowLeftRight size="18" aria-hidden="true" />
                <span>Принять</span>
            </RouterLink>
            <RouterLink class="tab" :class="{ active: is('/create') }" to="/create">
                <Plus size="18" aria-hidden="true" />
                <span>Создать</span>
            </RouterLink>
            <RouterLink class="tab" :class="{ active: is('/login') }" to="/login">
                <Settings size="18" aria-hidden="true" />
                <span>auth</span>
            </RouterLink>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import { LayoutDashboard, ArrowLeftRight, Plus, Settings } from 'lucide-vue-next';
const route = useRoute();
const is = (p: string) => route.path.startsWith(p);
</script>
