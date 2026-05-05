import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, setTokens, clearTokens, getAccessToken } from "../services/api";

// ── Types ─────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleLevel: number;
  businessId: string | null;
  branchId: string | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  shortId?: string;
  plan?: string;
  planStatus?: string;
  planExpiresAt?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface AuthState {
  user: User | null;
  business: Business | null;
  branch: Branch | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    business: null,
    branch: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount — check if already logged in
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    // Load profile
    authApi
      .profile()
      .then((data: any) => {
        setState({
          user: data.user,
          business: data.business,
          branch: data.branch,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        clearTokens();
        setState({ user: null, business: null, branch: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  // Login
  async function login(email: string, password: string) {
    const data = await authApi.login(email, password);
    setTokens(data.accessToken, data.refreshToken);
    setState({
      user: data.user,
      business: data.business,
      branch: data.branch,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  // Register
  async function register(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
  }) {
    const data = await authApi.register(payload);
    setTokens(data.accessToken, data.refreshToken);
    setState({
      user: data.user,
      business: data.business,
      branch: data.branch,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  // Logout
  async function logout() {
    try { await authApi.logout(); } catch {}
    clearTokens();
    setState({ user: null, business: null, branch: null, isAuthenticated: false, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;