<script setup lang="ts">
import Modal from './Modal.vue';
import { computed } from 'vue';
import type { Inventory } from '../../types/domain';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  userInv: Inventory[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'select', v: Inventory): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: () => emit('update:modelValue', false),
});

const onSelectItem = (item: Inventory) => {
  if (!item) {
    return false;
  }
  emit('select', item);
  emit('update:modelValue', false);
};
</script>
<template>
  <Modal
    v-model="open"
    :title="title"
    aria-labelledby="items-modal-title"
    aria-describedby="items-modal-desc"
  >
    <!-- Контент -->
    <section class="form">
      <ul class="chips" role="list">
        <li
          v-for="(value, i) in userInv"
          :key="i"
          class="chip"
          :title="value.item?.name"
          @click="onSelectItem(value)"
        >
          <span class="chip-dot" aria-hidden="true"> </span>
          <span class="chip-text">{{ value.item?.name }}</span>
        </li>
      </ul>
    </section>
  </Modal>
</template>

<style scoped>
/* Контейнеры */
.modal-header {
  padding: 16px 20px 8px;
  border-bottom: 1px solid var(--ui-border, #ececec);
}
.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-icon {
  width: 28px;
  height: 28px;
  opacity: 0.75;
}
.title {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 600;
}
.subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.65;
}

/* Контент */
.form {
  padding: 12px 20px 4px;
  max-height: min(48vh, 420px);
  overflow: auto;
}
.chips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.chip:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}
.chip-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

/* Футер */
.modal-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 20px 16px;
  background: linear-gradient(180deg, transparent, var(--ui-surface, #fff) 30%);
  border-top: 1px solid var(--ui-border, #ececec);
}
.btn {
  margin-top: 0;
}

/* Тёмная тема (если есть data-theme="dark" на html/body) */
:host-context([data-theme='dark']) .chip {
  background: #141414;
  border-color: #222;
}
:host-context([data-theme='dark']) .modal-header,
:host-context([data-theme='dark']) .modal-footer {
  border-color: #222;
}
</style>
