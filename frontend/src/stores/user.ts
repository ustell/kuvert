import { defineStore } from 'pinia';
import type { User } from '../types/domain';
import http from '../libs/http';
import type { UserDTO } from '../types/DTO';
type Store = {
  users: User[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  lastFetched: number | null;
};
export const useUsers = defineStore('users', {
  state: (): Store => ({
    users: [],
    loading: false,
    error: null,
    isLoaded: false,
    lastFetched: null,
  }),
  actions: {
    async getUser(): Promise<boolean> {
      const now = Date.now();
      this.loading = true;
      this.error = '';
      try {
        if (this.isLoaded && this.lastFetched && now - this.lastFetched < 15000) {
          console.log('Данные были обновленны менее 5 минут назад');
          return false;
        }
        const res = await http<{ data: User[] }>('GET', 'api/auth/users', undefined, {
          delay: 5000,
        });
        if (!res.ok && !res.error) {
          this.error = res.error;
          return false;
        }
        const payload = ((res.data as any).data ?? res.data) as User[];
        this.users = payload;
        this.isLoaded = true;
        this.lastFetched = now;
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log('Ошибка при получении пользователей: ', msg);
        this.error = msg;
        return false;
      } finally {
        this.loading = true;
      }
    },

    async create({ name, phone, password }: UserDTO, optimistic: boolean): Promise<boolean> {
      this.loading = true;
      this.error = '';
      if (!name.trim() || !phone.trim() || !password.trim()) {
        this.error = 'Обязательные поля не заполнены';
        return false;
      }

      const tempID = `temp_${Date.now()}`;
      if (optimistic) {
        const tempUser: User = {
          name,
          phone,
          password,
          id: tempID,
        };
        this.users.push(tempUser);
      }
      try {
        const res = await http<{ user: User }>(
          'POST',
          '/api/auth/users',
          { name, phone, password },
          undefined,
        );
        if (!res.ok) {
          this.error = res.error ?? 'Ошибка при создании пользователя';
          console.log('Ошибка запроса', res.error);
          this.users = this.users.filter((v) => v.id !== tempID);
          return false;
        }
        const payload = ((res.data as any).user ?? res.data) as User;
        const idx = this.users.findIndex((u) => u.id === tempID);
        if (idx !== -1) {
          this.users.splice(idx, 1, payload);
        }
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log('Ошибка при создании пользователя (Pinia) = ', msg);
        this.error = msg;
        this.users = this.users.filter((v) => v.id !== tempID);
        return false;
      } finally {
        this.loading = false;
      }
    },
    async delete(id: string): Promise<boolean> {
      this.loading = true;
      this.error = '';
      try {
        const res = await http<{ data: User }>('DELETE', '/api/auth/users', { id });
        if (!res.ok) {
          this.error = res.error ?? 'Не удалось удалить пользователя.';
          console.error('Ошибка в pinia при удалении', res.error);
          return false;
        }
        this.users = this.users.filter((u) => u.id !== id);
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.error = msg;
        console.log(msg);
        return false;
      } finally {
        this.loading = false;
      }
    },
    async update({ name, phone, password, id }: UserDTO): Promise<boolean> {
      this.loading = true;
      this.error = '';

      try {
        const res = await http<{ user: User }>(
          'PATCH',
          '/api/auth/users',
          { name, phone, password, id },
          undefined,
        );
        if (!res.ok) {
          this.error = res.error ?? 'Ошибка при обновлении пользователя';
          console.log('Ошибка запроса', res.error);
          return false;
        }
        const payload = ((res.data as any).users ?? res.data) as User;
        const idx = this.users.findIndex((u) => u.id === id);
        if (payload) {
          if (idx !== -1) {
            this.users.splice(idx, 1, payload);
          } else {
            this.users.push(payload as User);
          }
        }
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log('Ошибка при обновлении пользователя (Pinia) = ', msg);
        this.error = msg;
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
