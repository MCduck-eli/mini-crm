type ErrorLike = { message: string; code?: string } | null;

interface ResponseLike {
  data: unknown;
  error: ErrorLike;
}

export function friendlyError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  const message = (error as { message?: string })?.message;
  return message ?? 'Неизвестная ошибка. Попробуйте ещё раз.';
}

export async function fetchRows<T>(promise: PromiseLike<ResponseLike>): Promise<T[]> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function fetchRow<T>(promise: PromiseLike<ResponseLike>, notFound = 'Запись не найдена'): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  if (data === null || data === undefined) throw new Error(notFound);
  return data as T;
}

export async function mutate(promise: PromiseLike<ResponseLike>): Promise<void> {
  const { error } = await promise;
  if (error) throw new Error(error.message);
}
