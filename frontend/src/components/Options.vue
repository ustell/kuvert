<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
</script>

<template>
  <Select>
    <SelectTrigger
      class="w-full border-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent p-0"
    >
      <SelectValue placeholder="Выберите пользователя" />
    </SelectTrigger>
    <SelectContent class="border-0 shadow-md !bg-white dark:!bg-neutral-900 !bg-opacity-100">
      <SelectGroup class="border-0 shadow-md !bg-white dark:!bg-neutral-900 !bg-opacity-100">
        <slot />
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
