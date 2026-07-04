import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { comparePassword, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { ROLE_DASHBOARD_PATH } from "@/lib/rbac/permissions";

import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await withDbRetry(() =>
  prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
    include: { role: true },
  })
);

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  if (!user || user.deletedAt || !user.isActive) {
    await writeAuditLog({ action: "auth.loginFailed", entityType: "user", metadata: { email }, ipAddress: ip });
    return NextResponse.json({ error: "That email or password isn't right." }, { status: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    await writeAuditLog({ action: "auth.loginFailed", entityType: "user", entityId: user.id, ipAddress: ip });
    return NextResponse.json({ error: "That email or password isn't right." }, { status: 401 });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role.name,
    hospitalId: user.hospitalId,
    departmentId: user.departmentId,
    email: user.email,
  });
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: crypto.createHash("sha256").update(jti).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await writeAuditLog({
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    userId: user.id,
    hospitalId: user.hospitalId,
    ipAddress: ip,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    },
    redirectTo: ROLE_DASHBOARD_PATH[user.role.name],
    
  });

  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
