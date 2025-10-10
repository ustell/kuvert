export type UserDTO = {
  name: string;
  password: string;
  phone: string;
  isActive?: boolean;
  roleId?: number;
  id?: string;
};
export type Result<T> = { ok: true; data: any } | { ok: false; error: string };
