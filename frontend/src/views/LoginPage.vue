<script setup lang="ts">
import { ref } from "vue";
import Card from "../components/Card.vue";
import Button from "../components/Button.vue";
import { useAuth } from "../stores/auth";

const phone = ref("+70000000001");
const password = ref("123");
const remember = ref(true);
const show = ref(false);
const auth = useAuth()

const onSubmit = (e: Event) => {
  console.log('dsa')
  e.preventDefault()
  auth.login(phone.value, password.value)
}
</script>

<template>
  <div class="container login-wrap">
    <div class="logo">📦</div>
    <div class="brand">Production Tracker</div>
    <div class="muted center">Sign in to continue</div>

    <Card padded>
      <form @submit="onSubmit">
        <label class="label">Phone</label>
        <div class="field">
          <input v-model.trim="phone" type="tel" inputmode="tel" placeholder="+77000000000" class="inp"
            autocomplete="tel" />
        </div>
        <div class="hint error">123</div>

        <label class="label mt12">Password</label>
        <div class="field">
          <input v-model="password" :type="show ? 'text' : 'password'" placeholder="••••••••" class="inp"
            autocomplete="current-password" />
          <button type="button" class="link" @click="show = !show">
            {{ show ? "Hide" : "Show" }}
          </button>
        </div>
        <div class="hint error">123</div>

        <div class="row-between mt12">
          <label class="check">
            <input type="checkbox" v-model="remember" />
            <span>Remember me</span>
          </label>
          <button type="button" class="link muted">Forgot password?</button>
        </div>

        <Button variant="primary" :full="true" class="mt12">
          dsa
          <template>123</template>
          <template>123</template>
        </Button>
      </form>
    </Card>

    <div class="toast error" v-if="auth.error !== 'Не авторизован'">⚠ {{ auth.error }}</div>
  </div>
</template>



<style scoped>
.login-wrap {
  padding-top: 36px;
}

.logo {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eef3ff;
  border: 1px solid #dbe5ff;
  margin: 0 auto 10px;
}

.brand {
  text-align: center;
  font-weight: 800;
}

.center {
  text-align: center;
}

.hint {
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
}

.hint.error {
  color: var(--red);
}

.field.error {
  border-color: #fecaca !important;
  background: #fff1f2 !important;
}

.inp {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
}

.link {
  appearance: none;
  background: transparent;
  border: none;
  color: var(--brand);
  font-weight: 600;
  cursor: pointer;
}

.check {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #2a2f3a;
}

.toast.error {
  margin-top: 12px;
  background: #fff1f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 12px;
}
</style>