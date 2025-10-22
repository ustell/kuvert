export type UserDTO = {
  name: string;
  password: string;
  phone: string;
  isActive?: boolean;
  roleId?: number;
  id?: string;
};
export type Result<T> = { ok: true; data: any } | { ok: false; error: string };

// Базовые сущности
export type UUID = string;

export interface Meta {
  direct: number;
  needToCraft: number;
  requestedQty: number;
}

export interface Requirement {
  componentId: UUID;
  required: number;
}

export interface Plan {
  itemId: UUID;
  itemName: string;
  requestedQty: number;
  direct: number;
  needToCraft: number;
  note?: string;
  requirements: Requirement[];
}

export type Status = 'pending' | 'approved' | 'rejected' | string;

// То, что вы создаёте (транзакция/перевод)
export interface CreatedData {
  id: UUID;
  fromUserId: UUID;
  toUserId: UUID;
  itemId: UUID;
  status: Status;
  units: number;
  meta: Meta;
}

export interface CreatedRecord {
  // Иногда API кладёт тело в поле data, иногда — плоско. Поддержим оба варианта.
  data?: CreatedData;
  // Дублированные поля на случай плоской формы:
  id?: UUID;
  fromUserId?: UUID;
  toUserId?: UUID;
  itemId?: UUID;
  status?: Status;
  units?: number;
  meta?: Meta;

  createdAt?: string; // ISO
}

// Снимок остатков
export interface SnapshotItem {
  itemId: UUID;
  unitsLeft: number;
}

// План переноса/изготовления по позициям
export interface TransferPlanItem extends Plan {
  transferQty: number;
}

// Общий ответ API
export interface ApiResponse {
  ok: boolean;
  errors: string[];
  created: CreatedRecord[];
  plan?: Plan;
  snapshot?: SnapshotItem[];
  transferPlan?: TransferPlanItem[];
}
