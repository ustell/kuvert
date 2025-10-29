<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'close']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

// блокируем прокрутку body, когда модалка открыта
watch(
  () => props.modelValue,
  (v) => {
    const prev = document.body.style.overflow;
    if (v) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    // страховка при unmount
    onBeforeUnmount(() => (document.body.style.overflow = prev));
  },
);
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
      <div class="modal-backdrop" @click.self="close" />

      <div class="modal-window" role="document">
        <header class="modal-head">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-x" @click="close" aria-label="Закрыть">✕</button>
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
  backdrop-filter: saturate(120%) blur(1px);
}
.modal-window {
  position: relative;
  background: #fff;
  border-radius: 12px;
  width: 560px;
  max-width: calc(100% - 32px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: pop 0.16s ease-out;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.modal-head,
.modal-foot {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-body {
  padding: 0 16px 12px;
}
.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.modal-x {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 18px;
}
</style>
