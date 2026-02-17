# DECISIONS

1) Стек
- Backend: NestJS + TypeScript
- ORM: Prisma + SQLite (driver adapter better-sqlite3)
- Frontend: Next.js (App Router) + TypeScript + TailwindCSS

2) Архитектура
- Backend: модули NestJS по доменам (auth/users/requests/me) + слой сервисов
- Frontend: страницы App Router, API-клиент через fetch

3) Авторизация
- Упрощённый логин по имени/паролю
- JWT в `Authorization: Bearer ...`
- Роли `dispatcher` и `master` проверяются guard’ом

4) Статусы и бизнес-правила
- Статусы заявки: `new | assigned | in_progress | done | canceled`
- Переходы статусов ограничены в сервисе заявок

5) Race condition для "Взять в работу"
- Атомарность обеспечена условным обновлением записи в БД (updateMany с WHERE)
- При параллельных запросах один успешен, второй получает отказ (409)

6) Почему SQLite
- Локальный запуск без внешних зависимостей
- Простая доставка в Docker через volume

7) Компромиссы
- Для простоты проверки Prisma CLI используется в контейнере для миграций/сидов при старте
- Конфигурация через env для воспроизводимости (порты, URL API, секрет JWT, путь к БД)
