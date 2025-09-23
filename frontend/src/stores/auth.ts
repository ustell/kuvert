import { defineStore } from "pinia";
import { ApiError, AppError } from "../libs/errors";
import type { User } from "../types/domain";
import * as authApi from "../libs/authApi";

export const useAuth = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    error: "",
    isLoading: false,
  }),
  getters: {
    isAuth: (s) => !!s.user,
    role: (s) => s.user?.role ?? null,
  },
  actions: {
    async fetchMe() {
      console.log("fetch");
      this.isLoading = true;
      this.error = "";
      try {
        const res = await authApi.me();
        if (res.authenticated && res.user) {
          this.user = res.user;
          return true;
        }
        this.user = null;
        return false;
      } catch (e) {
        this.user = null;
        this.error = e instanceof ApiError ? e.message : "Session check failed";
      } finally {
        this.isLoading = false;
      }
    },
    async login(phone: string, password: string) {
      this.isLoading = true;
      this.error = "";
      try {
        const { user } = await authApi.login(phone, password);
        this.user = user;
        return true;
      } catch (error) {
        this.user = null;
        this.error =
          error instanceof ApiError ? error.message : "Login failed;";
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
