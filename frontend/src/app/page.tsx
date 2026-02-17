export default function Home() {
  return (
    <div className="container-page">
      <main className="mx-auto max-w-2xl fade-in-up">
        <h1 className="text-4xl font-semibold tracking-tight">
          Заявки в ремонтную службу
        </h1>
        <div className="mt-3 text-sm muted">
          Backend: http://localhost:3000 (можно переопределить через
          NEXT_PUBLIC_API_URL)
        </div>

        <div className="divider" />

        <div className="grid gap-3">
          <a className="card-subtle transition-colors hover:bg-[hsl(var(--panel))]" href="/login">
            <div className="text-sm font-semibold">Вход</div>
            <div className="mt-1 text-sm muted">Логин/пароль (диспетчер или мастер)</div>
          </a>
          <a className="card-subtle transition-colors hover:bg-[hsl(var(--panel))]" href="/create">
            <div className="text-sm font-semibold">Создать заявку</div>
            <div className="mt-1 text-sm muted">Форма создания заявки от клиента</div>
          </a>
          <a className="card-subtle transition-colors hover:bg-[hsl(var(--panel))]" href="/dispatcher">
            <div className="text-sm font-semibold">Панель диспетчера</div>
            <div className="mt-1 text-sm muted">Список заявок, назначение мастера, отмена</div>
          </a>
          <a className="card-subtle transition-colors hover:bg-[hsl(var(--panel))]" href="/master">
            <div className="text-sm font-semibold">Панель мастера</div>
            <div className="mt-1 text-sm muted">Свои заявки, взять в работу, завершить</div>
          </a>
        </div>
      </main>
    </div>
  );
}
