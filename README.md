# Mini-CRM «Объекты и задачи»

Лёгкая CRM для строительной компании: учёт объектов, постановка задач исполнителям и строгий журнал статусов. Интерфейс на русском, права разграничены на уровне базы данных.

## Возможности

- Две роли: **Постановщик** (`manager`) и **Исполнитель** (`worker`).
- Объекты: постановщик создаёт и редактирует все; исполнитель видит только те, по которым у него есть задача.
- Задачи: назначаются исполнителю и объекту, живут по фиксированному циклу статусов.
- История: каждое изменение статуса автоматически пишется в неизменяемый журнал с автором, временем и комментарием.
- Отдельная страница «Мои задачи» для исполнителя.

## Стек

| Слой | Технологии |
| --- | --- |
| Фронтенд | React 18, TypeScript, Vite 5, React Router 6, React Hook Form |
| Стили | Tailwind CSS 4 (`@tailwindcss/vite`), иконки Lucide |
| Бэкенд | Supabase: PostgreSQL, Auth, Row Level Security, RPC |

## Структура проекта

```
src/
  main.tsx              провайдеры: StrictMode → BrowserRouter → AuthProvider
  App.tsx               маршруты и защита приватных разделов
  index.css             Tailwind, бренд-токены, keyframes анимаций входа
  types.ts              Profile, AppObject, Task, TaskDetails, TaskHistoryEntry
  auth/
    AuthContext.ts      контекст + хук useAuth
    AuthProvider.tsx    сессия Supabase + загрузка роли из public.profiles
    ProtectedRoute.tsx  пусковой экран, редирект на /login, карточка «нет профиля»
    WorkerRoute.tsx     доступ к /my-tasks только для исполнителя
  api/
    objects.ts          CRUD объектов
    tasks.ts            список/детали/создание/правка/удаление + RPC смены статуса + история
    profiles.ts         список сотрудников и исполнителей
  lib/
    supabase.ts         клиент Supabase, флаг isSupabaseConfigured
    db.ts               fetchRows / fetchRow / mutate + friendlyError
    status.ts           список статусов, цвета, actionsFor(profile, task)
    format.ts           даты инициалы в формате ru-RU
    roles.ts            подписи ролей
    grouping.ts         группировка задач по объектам и счётчики по статусам
  hooks/
    useLoader.ts        универсальная загрузка { data, error, loading, reload }
  components/           25 небольших компонентов (кнопки, модалки, поля, карточки, история)
  pages/                LoginPage, ObjectsPage, ObjectPage, TaskPage, MyTasksPage, NotFoundPage
supabase/
  schema.sql            таблицы, функции, триггеры, RLS-политики, гранты
  seed.sql              демо-данные: 3 объекта, 6 задач, демо-аккаунты
  fix-demo-logins.sql           ремонт паролей демо-аккаунтов
  fix-demo-auth-metadata.sql    ремонт identities и метаданных GoTrue
  reset-demo-passwords.sh       сброс паролей через Admin API (service_role, без сохранения ключа)
vercel.json             SPA-rewrites + кеш статических assets
.env.example            шаблон переменных окружения
```

## Локальный запуск

```bash
npm install
cp .env.example .env.local      # вписать реальные значения
npm run dev                     # http://localhost:5173
```

Полезные команды:

```bash
npm run typecheck               # tsc --noEmit
npm run build                   # сборка в dist/
npm run preview                 # предпросмотр собранной версии
```

Если `.env.local` не заполнен, приложение покажет панель «Не заданы ключи Supabase» вместо белого экрана.

## Переменные окружения

| Имя | Значение |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL из Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Ключ `anon public` / publishable key |

Префикс `VITE_` обязателен: Vite подставляет такие переменные в клиентский код на этапе сборки. **Эти значения публичны** — безопасность держится на RLS, а не на скрытии ключа. `service_role` во фронтенд не должен попадать ни при каких условиях.

## Настройка Supabase

Выполнять строго по порядку, целиком одним запуском в SQL Editor (каждый файл написан «paste-safe»: долларовые теги `$fn$`/`$do$`, сигнатуры функций в одну строку, пустых строк внутри операторов нет).

1. `supabase/schema.sql` — таблицы, роли, триггеры, RLS, RPC `change_task_status`, функция `admin_create_user`.
2. `supabase/seed.sql` — демо-объекты, задачи, история и демо-аккаунты.
3. При проблемах со входом — `fix-demo-logins.sql`, затем `fix-demo-auth-metadata.sql`.

Обязательно после настройки проекта:

- **Authentication → Sign In / Up → Email**: выключить «Allow new users to sign up» (регистрация закрыта, аккаунты создаёт постановщик через `admin_create_user` или Dashboard).
- Новые сотрудники создаются постановщиком: либо через Dashboard (Authentication → Users → Add user, с флагом «Auto Confirm User»), либо функцией `admin_create_user` в SQL Editor. Самостоятельная регистрация закрыта.

## Демо-доступы

| Роль | Email | Пароль |
| --- | --- | --- |
| Постановщик | `boss@stroyka.ru` | `manager123` |
| Исполнитель | `builder1@stroyka.ru` | `worker123` |

Legacy-аккаунты `manager@stroyka.ru`, `worker1@stroyka.ru`, `worker2@stroyka.ru` созданы функцией `admin_create_user`, но GoTrue их не пускает (отсутствуют корректные записи `auth.identities`) — оставлены как есть, не удалять: каскадное удаление затронет задачи и историю.

## Бизнес-правила

Цикл статусов:

```
Новая → В работе → На проверке → Принята
                              ↘ На доработке → В работе (по кругу)
```

| Кто | Может |
| --- | --- |
| Постановщик | создавать объекты и задачи, редактировать, удалять, принимать работу (`Принята`) и отправлять на доработку (обязателен комментарий) |
| Исполнитель | видеть только свои задачи и объекты по ним, менять **только статус**: `Новая`/`На доработке` → `В работе`, `В работе` → `На проверке` |

`title`, `description`, `object_id`, `assignee_id`, `author_id` исполнитель изменить не может — это проверяется триггером `validate_task_update`, а не только скрытием кнопок в интерфейсе.

## Как обеспечивается безопасность

- **RLS включён на всех четырёх таблицах**; роль берётся из `public.profiles.role` (JWT `app_metadata.role` — только запасной путь, подделка claim не даёт прав).
- Политики: `objects_manager_all`, `objects_worker_select`, `tasks_manager_all`, `tasks_worker_select`, `tasks_worker_update`, `history_select_participants`, `history_no_client_insert`.
- Смена статуса идёт **только** через `security definer` RPC `change_task_status`, который вызывает те же бизнес-триггеры и пишет запись в историю.
- `task_history` защищён от UPDATE/DELETE триггером `protect_task_history` — история неизменяема для всех ролей.
- `admin_create_user` не исполняется ни `anon`, ни `authenticated` из клиента.
- Следствие неизменяемости истории: задачу, по которой уже есть записи журнала, удалить нельзя (постановщик может удалять только задачи без истории).

## Деплой на Vercel

1. Залить репозиторий на GitHub/GitLab.
2. Vercel → **Add New → Project** → выбрать репозиторий.
3. Framework Preset: `Vite`. Build Command `npm run build`, Output Directory `dist` — подхватываются автоматически, `vercel.json` отвечает за SPA-rewrites.
4. Environment Variables для окружения Production: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Deploy. После сборки проверить вход, список объектов и смену статуса.
6. Если для проекта включены дополнительные ограничения доступа к API (allowlist по домену) — добавить домен Vercel. По умолчанию Supabase принимает запросы с любого origin, это штатная схема для публичного anon-ключа.

Ключи меняются через Vercel → Settings → Environment Variables и повторный деплой; в `.env.local` их коммитить нельзя (уже в `.gitignore`).

## Ограничения текущей версии

- Один уровень прав: две роли, без подролей и группировки по объектным командам.
- Нет вложений, фото и файлов по задаче.
- Нет уведомлений о смене статуса (email/push).
- Нет пагинации: списки задач загружаются целиком.
- Удаление объекта каскадно удаляет его задачи — **но только если по ним нет записей в журнале**. Если история есть, база откажет в удалении (`История задач неизменяема`), и такой объект или задача фактически не удаляются. В демо-данных история есть по всем трём объектам, поэтому кнопка «Удалить объект» для них вернёт ошибку.
- Журнал статусов не архивируется и не чистится — при необходимости удаления данных сначала снимать защиту через служебную настройку `app.allow_history_write`, это делается только вручную в SQL Editor.
