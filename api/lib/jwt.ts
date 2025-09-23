import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const key = new TextEncoder().encode(env.AUTH_SECRET);

export async function sign(payload: Record<string, any>, days: number) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(key);
}

export async function verify<T>(token: string) {
  const { payload } = await jwtVerify(token, key);
  return payload as T;
}
