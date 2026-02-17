export type ApiError = {
  status: number;
  message: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("accessToken");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem("accessToken");
    return;
  }
  window.localStorage.setItem("accessToken", token);
}

async function parseError(res: Response): Promise<ApiError> {
  const status = res.status;
  try {
    const data = (await res.json()) as { message?: string | string[] };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    return { status, message: msg || res.statusText };
  } catch {
    return { status, message: res.statusText };
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const auth = init?.auth ?? false;
  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
