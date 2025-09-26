import { defineStore } from "pinia";
import type { Item } from "../types/domain";

export const useItem = defineStore("item", {
    state: () => ({
        items: null as Item[] | null,
        loading: false as boolean,
        error: null as Error | null
    }),
    actions: {
        async fetchItems() {
            this.loading = true
            this.error = null
            try {
                const res = await fetch('/api/auth/items', {
                    method: 'GET',
                    credentials: 'include',
                })

                if (!res.ok) {
                    this.error = await res.json()
                    console.log('error')
                    throw new Error(`HTTP ${res.status}`)
                }

                const { items } = await res.json()
                this.items = items
            } catch (error) {
                this.error = error as Error
            } finally {
                this.loading = false
            }
        }
    }
})
