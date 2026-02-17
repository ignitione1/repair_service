"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiError } from "@/lib/api";
import { apiFetch, setToken } from "@/lib/api";
import { me, logout } from "@/lib/auth";
import type { AuthUser, RepairRequest } from "@/lib/types";
import { useToast } from "@/app/_ui/toast";
import { statusBadgeClass, statusLabel } from "@/app/_ui/status";

type VisibleStatus = "" | "assigned" | "in_progress" | "done" | "canceled";

export default function MasterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [status, setStatus] = useState<VisibleStatus>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    return q.toString();
  }, [status]);

  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        if (u.role !== "master") {
          router.replace("/dispatcher");
          return;
        }
        setUser(u);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await apiFetch<RepairRequest[]>(`/me/requests?${query}`, {
        method: "GET",
        auth: true,
      });
      setRequests(list);
    } catch (e) {
      const err = e as ApiError;
      setError(`${err.status}: ${err.message}`);
      if (err.status === 401) {
        setToken(null);
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [query, router]);

  useEffect(() => {
    if (!user) return;
    void loadAll();
  }, [user, loadAll]);

  async function take(reqId: string) {
    setError(null);
    try {
      await apiFetch(`/requests/${reqId}/take`, { method: "POST", auth: true });
      showToast({ variant: "success", title: "В работе", message: "Заявка взята в работу" });
      await loadAll();
    } catch (e) {
      const err = e as ApiError;
      const msg = `${err.status}: ${err.message}`;
      setError(msg);
      showToast({ variant: "error", title: "Ошибка", message: msg });
    }
  }

  async function done(reqId: string) {
    setError(null);
    try {
      await apiFetch(`/requests/${reqId}/done`, { method: "POST", auth: true });
      showToast({ variant: "success", title: "Готово", message: "Заявка завершена" });
      await loadAll();
    } catch (e) {
      const err = e as ApiError;
      const msg = `${err.status}: ${err.message}`;
      setError(msg);
      showToast({ variant: "error", title: "Ошибка", message: msg });
    }
  }

  if (!user) {
    return (
      <div className="container-page">
        <div className="mx-auto max-w-5xl">
          <div className="skeleton h-10 w-56" />
          <div className="mt-6 grid gap-3">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Панель мастера</h1>
            <div className="mt-2 text-sm muted">Твои заявки: бери в работу, закрывай выполненные.</div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Выйти
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            className="input w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value as VisibleStatus)}
          >
            <option value="">Все мои</option>
            <option value="assigned">assigned</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="canceled">canceled</option>
          </select>
          <button className="btn btn-primary" onClick={() => void loadAll()} disabled={loading}>
            {loading ? "Обновляем..." : "Обновить"}
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-3">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-6 card">
            <div className="text-sm font-semibold">Заявок нет</div>
            <div className="mt-1 text-sm muted">Попробуй изменить фильтр статуса.</div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {requests.map((r) => (
              <div key={r.id} className="card fade-in-up">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-mono text-xs muted">{r.id}</div>
                      <span className={statusBadgeClass(r.status)}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <div className="mt-2 text-base font-semibold">
                      {r.clientName}
                    </div>
                    <div className="mt-1 text-sm muted">
                      {r.phone} · {r.address}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <button
                      className="btn btn-primary"
                      onClick={() => void take(r.id)}
                      disabled={r.status !== "assigned"}
                    >
                      Взять в работу
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => void done(r.id)}
                      disabled={r.status !== "in_progress"}
                    >
                      Завершить
                    </button>
                  </div>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm">{r.problemText}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
