<template>
  <button
    class="btn mt-2 mb-2"
    :class="[variant, { full, loading }]"
    v-bind="$attrs"
    :disabled="loading || Boolean(($attrs as any).disabled)"
    :aria-busy="loading"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-opacity="0.2"
          stroke-width="2"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </span>
    <span class="btn-content text-nowrap text-sm"><slot /></span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'danger' | 'ghost' | 'soft';
  full?: boolean;
  loading?: boolean;
}>();
</script>

<style scoped>
.btn-spinner {
  display: inline-flex;
  margin-right: 8px;
  vertical-align: middle;
}
.btn-content {
  vertical-align: middle;
}
.btn.loading {
  opacity: 0.95;
}
</style>
