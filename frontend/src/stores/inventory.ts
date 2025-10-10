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
  actions: {
    async getItems(id: string): Promise<boolean> {
      this.loading = true;
      try {
        const res = await http<{ data: Inventory }>('POST', '/api/auth/inventories', { id });
      } catch (error) {
        return false;
      }
    },
  },
});
