import { cookies } from "next/headers";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";

export const ACCESS_COOKIE = "formix_access";
export const REFRESH_COOKIE = "formix_refresh";

export async function getSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
