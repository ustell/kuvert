<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch, ref, nextTick } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'close']);

const modalRef = ref<HTMLElement | null>(null);
const uid = Math.random().toString(36).slice(2, 9);
const titleId = `modal-title-${uid}`;
const descId = `modal-desc-${uid}`;
let previousActive: Element | null = null;

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }

  // simple focus trap
  if (e.key === 'Tab' && modalRef.value) {
    const focusable = modalRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || !modalRef.value.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
};

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

// блокируем прокрутку body, когда модалка открыта
watch(
  () => props.modelValue,
  async (v) => {
    const prev = document.body.style.overflow;
    if (v) {
      previousActive = document.activeElement;
      document.body.style.overflow = 'hidden';
      await nextTick();
      // autofocus first focusable element or close button
      const root = modalRef.value as HTMLElement | null;
      if (root) {
        const first = root.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        (first ?? root).focus();
      }
    } else {
      document.body.style.overflow = '';
      try {
        (previousActive as HTMLElement | null)?.focus?.();
      } catch {}
    }
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
      :aria-labelledby="title ? titleId : undefined"
      :aria-describedby="description ? descId : undefined"
    >
      <div class="modal-backdrop" @click.self="close" />

      <div ref="modalRef" class="modal-window" role="document" tabindex="-1">
        <header class="modal-head">
          <h3 :id="titleId" class="modal-title">{{ title }}</h3>
          <button class="modal-x" @click="close" aria-label="Закрыть">✕</button>
        </header>

        <main class="modal-body">
          <slot />
          <p v-if="description" :id="descId" class="visually-hidden">{{ description }}</p>
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

.visually-hidden {
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap;
}
</style>
