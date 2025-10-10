<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'close']); // добавили 'close'

const close = () => {
  emit('update:modelValue', false);
  emit('close'); // <-- теперь будет вызываться всегда
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

const cancel = () => {
  emit('update:modelValue', false);
  emit('close'); // <-- и здесь тоже
};

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));
</script>

<template>
  <teleport to="body">
    <div
      v-if="props.modelValue"
      class="modal-root"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <!-- overlay -->
      <div class="modal-backdrop" @click.self="close"></div>

      <div class="modal-window">
        <header class="modal-head">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-x" @click="close">✕</button>
        </header>

        <main class="modal-body">
          <slot />
        </main>

        <footer class="modal-foot">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}
.modal-window {
  position: relative;
  background: #fff;
  border-radius: 8px;
  width: 520px;
  max-width: calc(100% - 32px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.modal-head,
.modal-foot {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-body {
  padding: 0px 16px;
}
.modal-x {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 18px;
}
</style>
