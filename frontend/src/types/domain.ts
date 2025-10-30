// src/types/domain.ts

// Статусы транзакций должны совпадать с Prisma enum

export type TransactionStatus = 'pending' | 'accepted' | 'rejected';

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
  units: number;
  user?: User;
  item?: Item;
  qty: number;
  Recipe?: Recipe;
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

// =============================
// 📦  Общие типы
// =============================

export type UUID = string;

export interface InventoryPreview {
  inventoryId: UUID;
  itemId: UUID;
  sku: string | null;
  name: string | null;
  units: number;
}

export interface MissingComponent {
  componentId: UUID;
  componentName?: string; // В PATCH отсутствует
  perUnit?: number; // Только в POST
  required: number;
  available: number;
  lack: number;
}

export interface Transaction {
  id: UUID;
  fromUserId: UUID;
  toUserId: UUID;
  itemId: UUID;
  units: number;
  status: TransactionStatus;
}

// =============================
// 📨 POST /api/transfer
// =============================

export interface TransferCreateRequest {
  userFromId: UUID;
  userToId: UUID;
  invItem: string; // может быть inventory.id, itemId, sku или name
  qty: number;
}

export type TransferCreateResponse =
  | TransferCreateResponsePendingReady
  | TransferCreateResponsePendingCraftable
  | TransferCreateResponseInsufficientStock
  | TransferCreateResponseInvalid;

export interface TransferCreateResponsePendingReady {
  ok: true;
  status: 'PENDING_READY';
  message: string;
  data: {
    transaction: Transaction;
    plan: {
      itemId: UUID;
      qtyRequested: number;
      transfer: { direct: number; craft: 0 };
    };
  };
}

export interface TransferCreateResponsePendingCraftable {
  ok: true;
  status: 'PENDING_CRAFTABLE';
  message: string;
  data: {
    transaction: Transaction;
    plan: {
      itemId: UUID;
      itemName: string;
      qtyRequested: number;
      transfer: { direct: number; craft: number };
      componentsToConsume: {
        componentId: UUID;
        componentName: string;
        perUnit: number;
        total: number;
        available: number;
      }[];
    };
  };
}

export interface TransferCreateResponseInsufficientStock {
  ok: false;
  status: 'INSUFFICIENT_STOCK_AND_NO_RECIPE' | 'INSUFFICIENT_STOCK_AND_COMPONENTS';
  message: string;
  details: {
    itemId: UUID;
    itemName?: string;
    qtyRequested?: number;
    availableReady?: number;
    needToCraft?: number;
    missingComponents?: MissingComponent[];
  };
}

export interface TransferCreateResponseInvalid {
  error: string;
  hint?: string;
  examples?: InventoryPreview[];
}

// =============================
// 🧾 PATCH /api/transfer
// =============================

export interface TransferUpdateRequest {
  txId: UUID;
  action?: 'accept' | 'reject'; // по умолчанию "accept"
}

export type TransferUpdateResponse =
  | TransferUpdateResponseAccepted
  | TransferUpdateResponseRejected
  | TransferUpdateResponseInsufficient
  | TransferUpdateResponseRace
  | TransferUpdateResponseError;

export interface TransferUpdateResponseAccepted {
  ok: true;
  status: 'ACCEPTED';
  message: string;
  data: {
    transaction: Transaction;
    applied: { direct: number; crafted: number };
  };
}

export interface TransferUpdateResponseRejected {
  ok: true;
  status: 'REJECTED';
  transaction: Transaction;
}

export interface TransferUpdateResponseInsufficient {
  ok: false;
  status: 'INSUFFICIENT_STOCK_AND_NO_RECIPE' | 'INSUFFICIENT_STOCK_AND_COMPONENTS';
  message: string;
  details: {
    itemId: UUID;
    qtyRequested?: number;
    availableReady?: number;
    needToCraft?: number;
    missingComponents?: MissingComponent[];
  };
}

export interface TransferUpdateResponseRace {
  ok: false;
  status: 'INSUFFICIENT_STOCK_AND_COMPONENTS_RACE' | 'INSUFFICIENT_READY_STOCK_RACE';
  message: string;
  details?: { componentId?: UUID };
}

export interface TransferUpdateResponseError {
  error: string;
}

// =============================
// ⚙️ Универсальный Union для работы с fetch
// =============================

export type TransferApiResponse = TransferCreateResponse | TransferUpdateResponse;

export type Result = { ok: true; data: any } | { ok: false; error: string };
