import { serialize, parse } from "cookie";

const name = process.env.COOKIE_NAME ?? "session";
const maxDays = Number(process.env.COOKIE_MAX_DAYS ?? "7");
const maxAge = maxDays * 24 * 60 * 60;

export const cookieName = name;
export const cookieMaxAge = maxAge;

export function makeSessionCookie(value: string) {
  return serialize(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie() {
  return serialize(name, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getCookie(reqCookieHeader?: string | string[]) {
  if (!reqCookieHeader) return {};
  const raw = Array.isArray(reqCookieHeader)
    ? reqCookieHeader.join("; ")
    : reqCookieHeader;
  return parse(raw);
}
