import { defineStore } from "pinia";
import type { Item } from "../types/domain";

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        byUser: {} as Record<string, { items: any[], total: number, loading: boolean, lastFetchedAt?: number }>
    }),
    actions: {
        async fetchUserInventories(userId: string) { }
    }
})