import * as React from "react";
import { Link, Navigate } from "react-router-dom";
import { LayoutDashboard, FileStack, Users, ScrollText, Building2, Menu } from "lucide-react";
import { ROLE_LABELS } from "../../lib/rbac/permissions";
import { LogoutButton } from "./logout-button";
import { Logo } from "../ui/logo";
import { useAuth } from "../../context/AuthContext";

export function AppShell({ children, active }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-teal border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const nav = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { key: "forms", label: "Forms", href: "/forms", icon: FileStack, show: true },
    { key: "patients", label: "Patients Directory", href: "/dashboard/patients", icon: Users, show: true },
    { key: "hospitals", label: "Hospitals", href: "/admin/hospitals", icon: Building2, show: user.role === "SUPER_ADMIN" },
    { key: "users", label: "Users", href: "/admin/users", icon: Users, show: user.role === "SUPER_ADMIN" || user.role === "HOSPITAL_ADMIN" },
    { key: "audit", label: "Audit logs", href: "/admin/audit-logs", icon: ScrollText, show: user.role === "SUPER_ADMIN" },
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-paper dark:bg-paper-dark">
      {/* MOBILE NAVBAR */}
      <header className="flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-paper-darkdim lg:hidden w-full z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-display text-sm font-semibold text-ink dark:text-white">Formix</span>
        </div>
        
        <div className="relative group">
          <button className="p-1.5 rounded-xs hover:bg-ink/5 dark:hover:bg-white/5 text-ink-soft dark:text-white/70 transition-colors focus:outline-none">
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-ink/10 bg-white p-2 shadow-panel dark:border-white/10 dark:bg-paper-darkdim opacity-0 scale-95 pointer-events-none group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto transition-all duration-150 z-50">
            <div className="px-3 py-1.5 border-b border-ink/5 mb-1">
              <p className="text-xs font-medium truncate text-ink dark:text-white">{user.email}</p>
              <p className="text-[10px] font-mono uppercase text-clinical-sage tracking-wide">{ROLE_LABELS[user.role]}</p>
            </div>
            <nav className="space-y-0.5">
              {nav.filter((n) => n.show).map((n) => (
                <Link
                  key={n.key}
                  to={n.href}
                  className={`flex items-center gap-2.5 rounded-xs px-3 py-2 text-xs font-medium transition-colors ${
                    active === n.key ? "bg-clinical-sagelight text-clinical-tealdeep font-semibold" : "text-ink-soft hover:bg-ink/5 dark:text-white/60"
                  }`}
                >
                  <n.icon className="h-4 w-4 shrink-0" /> {n.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-ink/5 mt-1 pt-1">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* PERSISTENT SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white dark:border-white/10 dark:bg-paper-darkdim">
        <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-4 dark:border-white/10">
          <Logo size="sm" />
          <span className="font-display text-sm font-semibold">Formix</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.filter((n) => n.show).map((n) => (
            <Link
              key={n.key}
              to={n.href}
              className={`flex items-center gap-2.5 rounded-xs px-3 py-2 text-sm font-medium transition-colors ${
                active === n.key ? "bg-clinical-sagelight text-clinical-tealdeep font-semibold" : "text-ink-soft hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/5"
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-ink/10 p-3 dark:border-white/10">
          <p className="px-3 text-xs font-medium truncate">{user.email}</p>
          <p className="px-3 text-[11px] text-ink-soft/60">{ROLE_LABELS[user.role]}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* FLUID WORKSPACE */}
      <div className="min-w-0 flex-1 w-full overflow-x-hidden box-border">{children}</div>
    </div>
  );
}
