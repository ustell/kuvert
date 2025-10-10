export class AppError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message); this.name = this.constructor.name;
  }
}

export class TimeoutError extends AppError { }
export class NetworkError extends AppError { }

export type ApiErrorPayload = { error?: string; message?: string; code?: string; details?: unknown };

export class ApiError extends AppError {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) { super(message) }
}

// Нормализуем любые ошибки в понятные экземпляры
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new TimeoutError('Запрос отменён по таймауту', err);
  }
  if (err instanceof TypeError) {
    // Как правило, сетевые ошибки fetch — это TypeError
    return new NetworkError('Сетевая ошибка (возможно, нет интернета?)', err);
  }
  return new AppError('Неизвестная ошибка', err);
}
