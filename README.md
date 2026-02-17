# Repair Service Requests

Веб-сервис для приёма и обработки заявок в ремонтную службу.

## Требования
- Docker + Docker Compose (v2)

## Быстрый старт
1) Скопируй переменные окружения:

```bash
cp .env.example .env
```

2) Запусти:

```bash
docker compose up --build
```

3) Открой приложение:
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

## Тестовые пользователи (из сидов)
- dispatcher / dispatcher123
- master1 / master123
- master2 / master123

## Что происходит при старте Docker
- backend применяет миграции
- backend выполняет сиды (создаёт пользователей и несколько заявок)

## Основные сценарии
- Создать заявку: http://localhost:3001/create
- Войти: http://localhost:3001/login
- Панель диспетчера: http://localhost:3001/dispatcher
- Панель мастера: http://localhost:3001/master

## Race condition: проверка "Взять в работу"
Цель: при двух параллельных запросах `take` один должен быть успешен, второй получить отказ (409).

### Шаг 1. Логинимся как мастер и получаем token

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"master1","password":"master123"}'
```

Из ответа возьми `token`.

### Шаг 2. Получаем список заявок мастера и выбираем заявку со статусом assigned

```bash
curl -s http://localhost:3000/me/requests \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

Найди `id` заявки со статусом `assigned`.

### Шаг 3. Два параллельных take (два терминала)
В терминале 1:

```bash
curl -i -X POST http://localhost:3000/requests/<REQUEST_ID>/take \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

В терминале 2 (почти одновременно):

```bash
curl -i -X POST http://localhost:3000/requests/<REQUEST_ID>/take \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

Ожидаемо:
- один запрос: 201
- второй запрос: 409 с сообщением, что заявка уже взята в работу

## Кратко про API
- POST /auth/login
- GET /auth/me
- GET /users (dispatcher)
- POST /requests
- GET /requests (dispatcher)
- POST /requests/:id/assign (dispatcher)
- POST /requests/:id/cancel (dispatcher)
- GET /me/requests (master)
- POST /requests/:id/take (master)
- POST /requests/:id/done (master)

## Соответствие ТЗ (маппинг)
- Роли dispatcher/master
  - backend: `src/auth/roles.guard.ts`, `src/auth/roles.decorator.ts`
  - frontend: страницы `/dispatcher`, `/master`
- Авторизация (логин/пароль, сиды)
  - backend: `src/auth/*`, сиды: `prisma/seed.ts`
- Поля заявки + статусы
  - prisma: `prisma/schema.prisma`
- Создание заявки (new)
  - backend: POST `/requests`
  - frontend: `src/app/create/page.tsx`
- Панель диспетчера: список, фильтр, assign, cancel
  - backend: `src/requests/requests.controller.ts`, `src/requests/requests.service.ts`
  - frontend: `src/app/dispatcher/page.tsx`
- Панель мастера: список своих, take, done
  - backend: `src/me/me.controller.ts`, `src/requests/requests.controller.ts`
  - frontend: `src/app/master/page.tsx`
- Race condition take
  - backend: `RequestsService.take()` использует атомарный `updateMany`
  - тест: `backend/test/app.e2e-spec.ts`
- Минимум 2 автотеста
  - `backend/test/app.e2e-spec.ts`

## Остановка
```bash
docker compose down
```

SQLite сохраняется в volume `sqlite_data`.
