// src/types/domain.ts

// Статусы транзакций должны совпадать с Prisma enum
export const TransactionStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export interface Role {
  id: string;
  name: string;
}

export interface RoleRule {
  id: string;
  fromRoleId: string;
  toRoleId: string;
  fromRole?: Role;
  toRole?: Role;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  password: string;
  createdAt?: string; // ISO date string из API
  isActive?: boolean;
  roleId?: string;
  role?: Role;
  inventories?: Inventory[];
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
  recipesOf: Recipe[];
}

export interface Recipe {
  qty: number;
  id: string;
  itemId: string; // родитель (изделие)
  componentItemId: string; // компонент
  quantity: string; // строкой, чтобы не терять точность (Decimal)
  scrapRate: string; // '0.0200'
  item?: Item;
  componentItem?: Item;
}

export interface Inventory {
  id?: string;
  userId?: string;
  itemId?: string;
  units?: string;
  user?: User;
  item?: Item;
  qty?: number;
}

export interface Transaction {
  id: string;
  status: TransactionStatus;

  fromUserId: string;
  toUserId: string;
  itemId: string;

  quantity: string; // Decimal -> string
  dateCreated: string;
  dateFinished?: string | null;

  fromUser?: User;
  toUser?: User;
  item?: Item;
}

// Удобные типы для таблиц/форм
export type ID = string;
export type DecimalStr = string;

// Ответы API (пример)
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Result<T> = { ok: true; data: any } | { ok: false; error: string };
