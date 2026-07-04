import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { RoleName } from "@prisma/client";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";

export interface AccessTokenPayload {
  sub: string; // user id
  role: RoleName;
  hospitalId: string | null;
  departmentId: string | null;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(userId: string) {
  const jti = nanoid(21);
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, { expiresIn: "30d" });
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string; jti: string };
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
