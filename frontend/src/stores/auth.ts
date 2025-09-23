import { AppError } from '../libs/errors'
import { defineStore } from "pinia";
import type { User } from "../types/domain";
import * as authApi from "../libs/authApi";
import { lsSet } from "../libs/storage";

export const useAuth = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        error: "",
        isAuth: false,
        isLoading: false
    }),
    actions: {
        async hydrate() {
            this.isLoading = true;
            this.error = ''
            try {
                const u = await authApi.me()
                this.user = u; this.isAuth = true;
            } catch (e) {
                this.user = null; this.isAuth = false;
                this.error = e instanceof AppError ? e.message : 'Ошибка инициализации';
            } finally {
                this.isLoading = false;
            }

        },
        async login(phone: string, password: string) {
            this.isLoading = true
            try {
                const u = await authApi.login(phone, password);
                this.user = u; this.isAuth = true;
                lsSet('Sessions', u.name)
            } catch (e) {
                this.user = null; this.isAuth = false;
                this.error = e instanceof Error ? e.message : 'Ошибка входа';
                console.log("Ошибка авторизациии");

                throw e; // чтобы UI мог показать тост/валидацию
            } finally {
                this.isLoading = false;
            }

        }

    }
})