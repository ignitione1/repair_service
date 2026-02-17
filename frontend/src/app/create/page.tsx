"use client";

import { useState } from "react";
import type { ApiError } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import type { RepairRequest } from "@/lib/types";
import { useToast } from "@/app/_ui/toast";
import { statusBadgeClass, statusLabel } from "@/app/_ui/status";

export default function CreatePage() {
  const { showToast } = useToast();
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [problemText, setProblemText] = useState("");
  const [created, setCreated] = useState<RepairRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreated(null);
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<RepairRequest>("/requests", {
        method: "POST",
        body: JSON.stringify({ clientName, phone, address, problemText }),
      });
      setCreated(res);
      showToast({
        variant: "success",
        title: "Заявка создана",
        message: `Статус: ${res.status}`,
      });
      setClientName("");
      setPhone("");
      setAddress("");
      setProblemText("");
    } catch (e) {
      const err = e as ApiError;
      const msg = `${err.status}: ${err.message}`;
      setError(msg);
      showToast({ variant: "error", title: "Ошибка", message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page">
      <div className="mx-auto max-w-2xl fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight">Создание заявки</h1>
        <div className="mt-2 text-sm muted">
          Заполни поля — заявка появится у диспетчера в статусе <span className="font-medium">new</span>.
        </div>

        <div className="divider" />

        <form onSubmit={onSubmit} className="card grid gap-4">
          <label className="block">
            <div className="text-sm font-medium">Имя клиента</div>
            <input
              className="input mt-2"
              placeholder="Иван"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Телефон</div>
            <input
              className="input mt-2"
              placeholder="+7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Адрес</div>
            <input
              className="input mt-2"
              placeholder="ул. Ленина, 1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Описание проблемы</div>
            <textarea
              className="input mt-2 min-h-28"
              placeholder="Не работает розетка..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Создаём..." : "Создать"}
            </button>
            <a className="text-sm muted underline-offset-4 hover:underline" href="/">
              На главную
            </a>
          </div>
        </form>

        {created ? (
          <div className="mt-6 card-subtle fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Заявка создана</div>
                <div className="mt-1 font-mono text-xs muted">{created.id}</div>
              </div>
              <span className={statusBadgeClass(created.status)}>
                {statusLabel(created.status)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
