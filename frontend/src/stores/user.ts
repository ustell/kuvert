// frontend/src/stores/user.ts
import { defineStore } from "pinia";
import type { User } from "../types/domain";
import http from "../libs/http";
type Store = {
    users: User[] | null
    loading: boolean
    error: string | null
}

export const useUsers = defineStore("users", {
    state: (): Store => ({
        users: null,
        loading: false,
        error: null
    }),
    actions: {
        async fetchUsers(signal?: AbortSignal) {
            this.loading = true
            try {
                const res = await http<{ data?: User[] }>("GET", 'api/auth/users', undefined, {
                    delay: 200,
                    signal,
                })
                if (!res.ok) {
                    this.error = "HTTP " + res.status
                    return false
                }
                const payload = (res.data as any)?.data ?? res.data ?? []
                const users = (payload && (payload.data ?? payload)) as User | null

                this.users = users
                return true
            } catch (error) {
                this.error = 'HTTP ' + error
            } finally {
                this.loading = false
            }
        },
        async deliteUser(id: string) {
            this.loading = true
            try {
                const res = await http<{ data: User }>("DELETE", `api/auth/users/${id}`, { id: id }, {
                    delay: 10000,
                })
                if (!res.ok) {
                    this.error = 'HTTP ' + res.status
                    return false
                }


            } catch (error) {

            }
        }
    }
})
