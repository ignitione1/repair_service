"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth";
import type { ApiError } from "@/lib/api";
import { useToast } from "@/app/_ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("dispatcher");
  const [password, setPassword] = useState("dispatcher123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(name, password);
      showToast({
        variant: "success",
        title: "Успешный вход",
        message: `Вы вошли как ${res.user.name}`,
      });
      if (res.user.role === "dispatcher") {
        router.push("/dispatcher");
      } else {
        router.push("/master");
      }
    } catch (e) {
      const err = e as ApiError;
      const msg = `${err.status}: ${err.message}`;
      setError(msg);
      showToast({ variant: "error", title: "Ошибка входа", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page">
      <div className="mx-auto max-w-md fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight">Вход</h1>
        <div className="mt-2 text-sm muted">
          Войди как диспетчер или мастер, чтобы продолжить.
        </div>

        <div className="divider" />

        <form onSubmit={onSubmit} className="card space-y-4">
          <label className="block">
            <div className="text-sm font-medium">Логин</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input mt-2"
              placeholder="dispatcher | master1 | master2"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Пароль</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-2"
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Входим..." : "Войти"}
          </button>

          <div className="text-xs muted">
            Сиды по умолчанию: dispatcher/dispatcher123, master1/master123,
            master2/master123
          </div>
        </form>
      </div>
    </div>
  );
}
