import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  email: string;
  plan: string;
  credits: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "rankpilot_token";
const USER_KEY = "rankpilot_user";

function getApiBase(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveAuth = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(
    (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      const headers: HeadersInit = {
        ...(options.headers as Record<string, string> ?? {}),
      };
      if (currentToken) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${currentToken}`;
      }
      if (!(options.body instanceof FormData)) {
        (headers as Record<string, string>)["Content-Type"] =
          (headers as Record<string, string>)["Content-Type"] ?? "application/json";
      }
      return fetch(url, { ...options, headers });
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;
    try {
      const res = await authFetch(`${getApiBase()}/api/me`);
      if (res.ok) {
        const data = await res.json();
        const updated: AuthUser = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        setUser(updated);
      } else {
        clearAuth();
      }
    } catch {
      // network error — keep existing state
    }
  }, [authFetch, clearAuth]);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
    if (token) {
      refreshUser();
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${getApiBase()}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Login failed.");
        saveAuth(data.token, data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${getApiBase()}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Signup failed.");
        saveAuth(data.token, data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, refreshUser, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
