import { defineStore } from 'pinia';

export type Role = { id: string; name: string };

export const useRoles = defineStore('roles', {
  state: () => ({
    roles: [] as Role[],
    isLoaded: false,
  }),
});


