import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCommunitySummary, fetchMe, type CommunitySummary, type User } from "../api";

export function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function useAuthUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<CommunitySummary>({
    unreadMessages: 0,
    unreadNotifications: 0,
  });

  const refreshSummary = useCallback(async () => {
    try {
      const s = await fetchCommunitySummary();
      setSummary(s);
    } catch {
      /* ignore when offline */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
      setError("");
      await refreshSummary();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar sessão.";
      setError(message);
      if (message.includes("Sessão expirada") || message.includes("Não autenticado")) {
        navigate("/login", { replace: true });
      }
    }
  }, [refreshSummary, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return {
    user,
    displayUser: user ?? readStoredUser(),
    error,
    setError,
    logout,
    reload: load,
    summary,
    refreshSummary,
  };
}
