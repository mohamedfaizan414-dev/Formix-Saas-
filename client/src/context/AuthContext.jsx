import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.ok ? await res.json() : null;
        setUser(data?.user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  async function login(email, password) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Authentication failed");
        return false;
      }
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate("/dashboard");
      return true;
    } catch {
      toast.error("Network communication failure.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Signed out successfully.");
      navigate("/login");
    } catch {
      toast.error("Network communication failure.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
