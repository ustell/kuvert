import { defineStore } from 'pinia';
import type { Inventory, Item } from '../types/domain';
import http from '../libs/http';
type state = {
  inventory: Inventory[] | null;
  loading: boolean;
  error: string;
};

export const useInventoryStore = defineStore('inventory', {
  state: (): state => ({
    inventory: null,
    loading: false,
    error: '',
  }),
  actions: {},
});
