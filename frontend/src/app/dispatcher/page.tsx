"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiError } from "@/lib/api";
import { apiFetch, setToken } from "@/lib/api";
import { me, logout } from "@/lib/auth";
import type { AuthUser, RepairRequest, RequestStatus } from "@/lib/types";
import { useToast } from "@/app/_ui/toast";
import { statusBadgeClass, statusLabel } from "@/app/_ui/status";

type Master = { id: string; name: string };

export default function DispatcherPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [status, setStatus] = useState<RequestStatus | "">("");
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
        if (u.role !== "dispatcher") {
          router.replace("/master");
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
      const list = await apiFetch<RepairRequest[]>(`/requests?${query}`, {
        method: "GET",
        auth: true,
      });
      setRequests(list);

      const allUsers = await apiFetch<{ id: string; name: string; role: string }[]>(
        "/users",
        { method: "GET", auth: true },
      );
      setMasters(
        allUsers
          .filter((u) => u.role === "master")
          .map((u) => ({ id: u.id, name: u.name })),
      );
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

  async function assign(reqId: string, masterId: string) {
    setError(null);
    try {
      await apiFetch(`/requests/${reqId}/assign`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ masterId }),
      });
      showToast({ variant: "success", title: "Назначено", message: "Мастер назначен" });
      await loadAll();
    } catch (e) {
      const err = e as ApiError;
      const msg = `${err.status}: ${err.message}`;
      setError(msg);
      showToast({ variant: "error", title: "Ошибка", message: msg });
    }
  }

  async function cancel(reqId: string) {
    setError(null);
    try {
      await apiFetch(`/requests/${reqId}/cancel`, {
        method: "POST",
        auth: true,
      });
      showToast({ variant: "success", title: "Отменено", message: "Заявка отменена" });
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
          <div className="skeleton h-10 w-64" />
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
            <h1 className="text-3xl font-semibold tracking-tight">Панель диспетчера</h1>
            <div className="mt-2 text-sm muted">Назначай мастеров, отслеживай статусы, отменяй заявки.</div>
          </div>
          <div className="flex items-center gap-2">
            <a className="btn btn-secondary" href="/create">
              Создать заявку
            </a>
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
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            className="input w-auto"
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              const allowed: Array<RequestStatus | ""> = [
                "",
                "new",
                "assigned",
                "in_progress",
                "done",
                "canceled",
              ];
              if (allowed.includes(v as RequestStatus | "")) {
                setStatus(v as RequestStatus | "");
              }
            }}
          >
            <option value="">Все статусы</option>
            <option value="new">new</option>
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
            <div className="mt-1 text-sm muted">Попробуй изменить фильтр статуса или создать новую заявку.</div>
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
                    <div className="text-sm muted">
                      Мастер: {r.assignedTo ? r.assignedTo.name : "—"}
                    </div>
                    <select
                      className="input"
                      defaultValue={""}
                      onChange={(e) => {
                        const masterId = e.target.value;
                        if (!masterId) return;
                        void assign(r.id, masterId);
                      }}
                      disabled={r.status !== "new"}
                    >
                      <option value="">Назначить мастера</option>
                      {masters.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn btn-danger"
                      onClick={() => void cancel(r.id)}
                      disabled={!(r.status === "new" || r.status === "assigned")}
                    >
                      Отменить
                    </button>
                  </div>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm">
                  {r.problemText}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
