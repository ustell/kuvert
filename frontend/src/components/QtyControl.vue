<template>
  <div class="qty-control inline-flex items-center gap-2">
    <button
      type="button"
      class="qty-btn"
      :disabled="disabled"
      @click="onDec"
      aria-label="Уменьшить"
    >
      −
    </button>
    <input
      type="number"
      class="qty-input"
      :value="value"
      :disabled="disabled"
      min="0"
      @input="onInput"
      aria-label="Количество"
    />
    <button
      type="button"
      class="qty-btn"
      :disabled="disabled"
      @click="onInc"
      aria-label="Увеличить"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
const { value, disabled } = defineProps<{
  value: number;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:value', v: number): void;
  (e: 'inc'): void;
  (e: 'dec'): void;
}>();

function onInc() {
  const v = Number(value ?? 0) + 1;
  emit('update:value', v);
  emit('inc');
}
function onDec() {
  const v = Math.max(0, Number(value ?? 0) - 1);
  emit('update:value', v);
  emit('dec');
}

function onInput(e: Event) {
  const t = e.target as HTMLInputElement | null;
  const n = Math.max(0, Math.floor(Number(t?.value ?? 0) || 0));
  emit('update:value', n);
}
</script>

<style scoped>
.qty-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 2px 6px;
}
.qty-input {
  text-align: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 2px 4px;
}
</style>
