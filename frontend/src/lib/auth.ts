import { apiFetch, setToken } from "./api";
import type { AuthUser } from "./types";

export async function login(name: string, password: string) {
  const res = await apiFetch<{ accessToken: string; user: AuthUser }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ name, password }),
    },
  );
  setToken(res.accessToken);
  return res;
}

export async function me() {
  const res = await apiFetch<{ user: AuthUser }>("/auth/me", {
    method: "GET",
    auth: true,
  });
  return res.user;
}

export function logout() {
  setToken(null);
}
