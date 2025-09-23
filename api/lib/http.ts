export const ok = (data: unknown, init?: number | ResponseInit) =>
  new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : 200,
    headers: { "content-type": "application/json" },
    ...(typeof init === "object" ? init : {}),
  });

export const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
}
