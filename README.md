# TaskFlow AI

Современное веб-приложение для совместного управления задачами и проектами. TaskFlow AI позволяет создавать доски задач, приглашать участников по ссылке, управлять задачами с помощью drag-and-drop и работать в команде в реальном времени. Приложение поддерживает русский и английский языки интерфейса.

**Демо:** [https://taskflow-ai-beta.vercel.app](https://taskflow-ai-beta.vercel.app)

---

## Получение исходников

```bash
git clone https://github.com/YOUR_USERNAME/taskflow-ai.git
cd taskflow-ai
```

---

## Требования

### Необходимое ПО

| Компонент | Версия | Установка |
|-----------|--------|-----------|
| **Node.js** | 18 LTS или выше | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ (идёт с Node.js) | Устанавливается вместе с Node.js |

### База данных

Проект использует **Supabase** — облачную PostgreSQL базу данных с встроенной аутентификацией.

- Аккаунт Supabase не требуется для проверки — проект уже подключён к рабочей базе данных
- Для создания своего инстанса: [supabase.com](https://supabase.com/) (бесплатный план)

---

## Запуск проекта

### 1. Установка зависимостей

```bash
cd taskflow-ai
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
VITE_SUPABASE_URL=https://aolaykhgakbgaatrgimv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbGF5a2hnYWtiZ2FhdHJnaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjIyMDksImV4cCI6MjA4MTk5ODIwOX0.LQyCxI-Pz0z519-ZvtHMqbbqWyWrW5czB02iPAabn9M
```

> **Примечание:** Эти ключи предоставлены для проверки преподавателями. База данных уже настроена и содержит необходимые таблицы.

### 3. Настройка базы данных (только для нового инстанса)

Если вы создаёте свой Supabase проект, выполните SQL скрипты в Supabase SQL Editor:

```bash
# Порядок выполнения:
1. supabase/complete_schema.sql    # Создаёт таблицы и RLS политики
2. supabase/join_board_by_invite.sql  # Создаёт функцию для приглашений
```

### 4. Запуск приложения

```bash
npm run dev
```

### 5. Открытие в браузере

После запуска приложение доступно по адресу:

```
http://localhost:5173
```

---

## Основной бизнес-кейс

### Сценарий: Создание доски и приглашение участника

#### Шаг 1: Регистрация
1. Откройте приложение
2. Нажмите "Register" (или "Регистрация" при русском интерфейсе)
3. Заполните форму: имя, email, пароль
4. Нажмите "Create Account"

#### Шаг 2: Создание доски
1. На Dashboard нажмите "New Board"
2. Введите название доски (например, "Мой проект")
3. Нажмите "Create Board"

#### Шаг 3: Добавление задач
1. Откройте созданную доску
2. В колонке "To Do" нажмите "+" 
3. Введите название задачи и описание
4. Нажмите "Save"
5. Перетащите задачу в другую колонку (drag-and-drop)

#### Шаг 4: Приглашение участника
1. Нажмите на кнопку настроек доски (шестерёнка)
2. Скопируйте invite-ссылку
3. Отправьте ссылку другому пользователю
4. Получатель перейдёт по ссылке и нажмёт "Accept"
5. Доска появится в его Dashboard

#### Шаг 5: Совместная работа
- Оба участника видят изменения в реальном времени
- Можно назначать задачи на участников
- Уведомления о приглашениях отображаются в колокольчике

---

## Структура проекта

```
taskflow-ai/
├── components/           # React UI компоненты
│   ├── Common.tsx       # Базовые компоненты (Button, Input, Modal, Avatar)
│   ├── Toast.tsx        # Компонент уведомлений
│   ├── TaskModal.tsx    # Модальное окно задачи
│   └── TypeManager.tsx  # Управление типами задач
│
├── pages/               # Страницы приложения
│   ├── Auth.tsx         # Страницы входа и регистрации
│   ├── Dashboard.tsx    # Главная страница с досками
│   ├── BoardView.tsx    # Просмотр и редактирование доски
│   └── Profile.tsx      # Профиль пользователя
│
├── store/               # Redux store
│   ├── index.ts         # Конфигурация store
│   ├── authSlice.ts     # Слайс аутентификации
│   ├── boardsSlice.ts   # Слайс досок и задач
│   ├── usersSlice.ts    # Слайс пользователей и уведомлений
│   └── uiSlice.ts       # Слайс UI состояния
│
├── services/            # Сервисы и API
│   ├── supabaseClient.ts    # Инициализация Supabase клиента
│   ├── supabaseBackend.ts   # API методы для работы с БД
│   └── geminiService.ts     # Интеграция с Gemini AI (опционально)
│
├── i18n/                # Мультиязычность
│   ├── translations.ts  # Переводы EN/RU
│   ├── LanguageContext.tsx  # React контекст языка
│   └── index.ts         # Экспорты
│
├── supabase/            # SQL скрипты для базы данных
│   ├── complete_schema.sql      # Схема БД и RLS политики
│   └── join_board_by_invite.sql # Функция приглашений
│
├── App.tsx              # Главный компонент с роутингом
├── index.tsx            # Точка входа React
├── types.ts             # TypeScript типы
├── index.html           # HTML шаблон
└── vite.config.ts       # Конфигурация Vite
```

---

## Технологии

- **Frontend:** React 19, TypeScript
- **Стилизация:** TailwindCSS 4
- **State Management:** Redux Toolkit
- **Роутинг:** React Router 7
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Сборка:** Vite 6

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm install` | Установка зависимостей |
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Production сборка |
| `npm run preview` | Превью production сборки |
| `npm test` | Запуск тестов |

---

## Лицензия

MIPT
