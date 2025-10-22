import { defineStore } from 'pinia';
import type { Item } from '../types/domain';
import http from '../libs/http';

export const useItem = defineStore('item', {
  state: () => ({
    items: undefined as Item[] | undefined,
    loading: false as boolean,
    error: '' as string | null,
  }),
  actions: {},
});
