<script setup lang="ts">
import Modal from './Modal.vue';
import { computed } from 'vue';
import type { Inventory } from '../../types/domain';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  userInv: Inventory[] | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'select', v: Inventory): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: () => emit('update:modelValue', false),
});

const onSelectItem = (item?: Inventory) => {
  if (!item) return;
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
    <section class="form">
      <ul class="chips" role="list">
        <li
          v-for="(value, i) in userInv ?? []"
          :key="value.id ?? i"
          class="chip"
          :title="value.item?.name"
          @click="onSelectItem(value)"
        >
          <span class="chip-dot" aria-hidden="true"></span>
          <span class="chip-text">{{ value.item?.name ?? '—' }}</span>
        </li>
      </ul>
    </section>
  </Modal>
</template>

<style scoped>
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
.chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
</style>
