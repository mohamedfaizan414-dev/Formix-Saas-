import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth/jwt-edge";
import { ACCESS_COOKIE } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/dashboard", "/forms", "/admin", "/fill"];

const SUPER_ADMIN_ONLY_PREFIXES = ["/admin/hospitals", "/admin/audit-logs"];
const ADMIN_SHARED_PREFIXES = ["/admin/users"]; // SUPER_ADMIN + HOSPITAL_ADMIN
const BUILDER_ROLES = ["SUPER_ADMIN", "HOSPITAL_ADMIN"];



export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyAccessTokenEdge(token);

if (SUPER_ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && payload.role !== "SUPER_ADMIN") {
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

if (ADMIN_SHARED_PREFIXES.some((p) => pathname.startsWith(p)) && !BUILDER_ROLES.includes(payload.role)) {
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/forms/:path*", "/admin/:path*", "/fill/:path*"],
};