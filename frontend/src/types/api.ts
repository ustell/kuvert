export type Id = string;

export type UserDTO = {
  id?: Id;
  name: string;
  phone: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ListResponse<T> = {
  items: T[];
  total?: number;
};

export type ApiError = { code?: string; message: string };
export type ApiResponse<T> = { ok: boolean; data?: T; error?: ApiError; status: number };
