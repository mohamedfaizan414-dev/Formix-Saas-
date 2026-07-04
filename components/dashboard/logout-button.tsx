"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-xs px-3 py-1.5 text-xs text-ink-soft hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/5">
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  );
}
