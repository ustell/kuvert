import { clearSessionCookie } from "../lib/auth";

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  return new Response(null, { status: 204, headers: clearSessionCookie() });
}
