# TaskFlow AI

TaskFlow AI — веб-приложение для совместного управления проектами и задачами в формате Kanban-досок.

- **Сайт:** https://taskflow-ai-beta.vercel.app
- **Документация:** https://taskflow-ai-beta.vercel.app/docs
- **Репозиторий:** https://github.com/arty989/TaskflowAI

## Возможности

- регистрация и вход пользователей;
- создание и удаление досок;
- создание колонок, типов и задач;
- перенос задач между колонками с помощью drag-and-drop;
- назначение исполнителей;
- приглашение участников на доску;
- уведомления о приглашениях;
- редактирование профиля;
- русский и английский интерфейс.

## Архитектура

```text
Браузер
  |
  | HTTPS
  v
Vercel (React + Vite)
  |
  | HTTPS API
  v
Supabase
  ├── Authentication
  └── PostgreSQL + Row Level Security
```

Локальная Docker-сборка использует Node.js для сборки приложения и Nginx для раздачи статических файлов.

## Технологии

- React 19;
- TypeScript;
- Vite;
- Redux Toolkit;
- React Router;
- Supabase Auth;
- PostgreSQL;
- Docker;
- Nginx;
- Vercel.

## Запуск через Docker

### 1. Клонирование

```bash
git clone https://github.com/arty989/TaskflowAI.git
cd TaskflowAI
```

### 2. Переменные окружения

```bash
cp .env.example .env
nano .env
```

Заполните:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY=
```

Не используйте `service_role`, `sb_secret_...` или другие серверные секреты во frontend-переменных.

### 3. Сборка и запуск

```bash
docker-compose up --build
```

Приложение:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/health
```

Остановка:

```bash
docker-compose down
```

## Запуск без Docker

```bash
npm install
npm run dev
```

Dev-сервер:

```text
http://localhost:8000
```

## Настройка собственного Supabase

1. Создайте проект Supabase.
2. Выполните в SQL Editor:

```text
supabase/complete_schema.sql
supabase/join_board_by_invite.sql
```

3. Добавьте URL проекта и publishable key в `.env`.

## Проверка основного сценария

1. Зарегистрируйте двух пользователей.
2. Первый пользователь создаёт доску и задачу.
3. Первый пользователь приглашает второго.
4. Второй принимает приглашение.
5. Оба пользователя открывают одну доску и работают с задачами.

## Безопасность

- `.env` и `.env.local` исключены из Git;
- клиент использует только Supabase publishable key;
- доступ к данным ограничивается PostgreSQL Row Level Security;
- серверные secret/service-role ключи не должны попадать в браузер или репозиторий.

## Автор

Артемий Парамонов  
МФТИ, учебный проект по компьютерным сетям.
