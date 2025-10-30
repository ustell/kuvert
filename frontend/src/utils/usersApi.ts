export async function deliteUser(id: string) {
  const row = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!row.ok) {
    const e = await row.json().catch(() => ({ error: 'Internal Server Error' } as any));
    throw new Error((e as any).error ?? 'Internal Server Error');
  }
  return row.json();
}
