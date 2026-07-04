import { jwtVerify } from "jose";
import type { RoleName } from "@prisma/client";
import type { AccessTokenPayload } from "./jwt";

const encodedSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "dev-access-secret"
);

export async function verifyAccessTokenEdge(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, encodedSecret);
  return payload as unknown as AccessTokenPayload;
}