<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '../stores/auth'

const phone = ref('')
const password = ref('')
const auth = useAuth()

const disabled = computed(() => auth.isLoading || !phone.value || !password.value)

async function onSubmit() {
    try {
        await auth.login(phone.value, password.value)
        // тут, если используешь router, можно сделать:
        // router.push('/')
    } catch {
        // ошибка уже в auth.error
    }
}
</script>

<template>
    <section class="card">
        <h1 class="h1">Вход</h1>

        <form @submit.prevent="onSubmit" class="form">
            <label class="form-row">
                <span>Телефон</span>
                <input v-model="phone" type="tel" placeholder="+7700..." />
            </label>

            <label class="form-row">
                <span>Пароль</span>
                <input v-model="password" type="password" />
            </label>

            <p v-if="auth.error" class="error">{{ auth.error }}</p>

            <button class="btn primary full" :disabled="disabled">
                {{ auth.isLoading ? 'Входим…' : 'Продолжить' }}
            </button>
        </form>
    </section>
</template>

<style scoped>
.form {
    display: grid;
    gap: 12px;
}

.form-row {
    display: grid;
    gap: 6px;
}

.error {
    color: #d33;
}
</style>
