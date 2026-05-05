
import { authApi, setTokens, clearTokens, getAccessToken } from "./api";

export async function login(email: string, password: string) {
  const data = await authApi.login(email, password);
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function register(payload: {
  email: string; password: string;
  firstName: string; lastName: string; businessName: string;
}) {
  const data = await authApi.register(payload);
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout() {
  try { await authApi.logout(); } catch {}
  clearTokens();
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}