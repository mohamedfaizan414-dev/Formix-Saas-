import * as React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  
  return (
    <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-xs px-3 py-1.5 text-xs text-ink-soft hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/5">
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  );
}
