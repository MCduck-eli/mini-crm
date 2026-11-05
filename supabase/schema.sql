-- ============================================================
-- Mini-CRM "Объекты и задачи" — схема, RLS, триггеры
-- Запускать ПОЛНОСТЬЮ, одним нажатием Run, в Supabase SQL Editor
-- Роль выполнения: postgres (владелец таблиц) — SECURITY DEFINER работает
-- ============================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ------------------------------------------------------------
-- Таблицы
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('manager', 'worker')),
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  object_id uuid not null references public.objects (id) on delete cascade,
  assignee_id uuid references public.profiles (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'Новая' check (status in ('Новая', 'В работе', 'На проверке', 'Принята', 'На доработке')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  old_status text,
  new_status text not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_object_id_idx on public.tasks (object_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists task_history_task_idx on public.task_history (task_id, created_at);

-- ------------------------------------------------------------
-- Текущая роль пользователя: источник истины — public.profiles.role
-- ------------------------------------------------------------

create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = public, extensions, pg_temp
as $fn$
select coalesce(
  (select p.role from public.profiles p where p.id = auth.uid()),
  case when auth.uid() is null then null else nullif(auth.jwt() -> 'app_metadata' ->> 'role', '') end
);
$fn$;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp
as $fn$
select auth.uid() is not null and public.current_user_role() = 'manager';
$fn$;

create or replace function public.is_worker() returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp
as $fn$
select auth.uid() is not null and public.current_user_role() = 'worker';
$fn$;

-- ------------------------------------------------------------
-- Видимость объектов и истории
-- ------------------------------------------------------------

create or replace function public.worker_has_task_on(p_object_id uuid) returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp
as $fn$
select exists (
  select 1 from public.tasks t
  where t.object_id = p_object_id and t.assignee_id = auth.uid()
);
$fn$;

create or replace function public.can_see_history(p_task_id uuid) returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp
as $fn$
select public.is_manager()
  or exists (
    select 1 from public.tasks t
    where t.id = p_task_id and (t.author_id = auth.uid() or t.assignee_id = auth.uid())
  )
  or exists (
    select 1 from public.task_history h
    where h.task_id = p_task_id and h.user_id = auth.uid()
  );
$fn$;

create or replace function public.set_updated_at() returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

-- ------------------------------------------------------------
-- Создание аккаунтов (открытая регистрация закрыта)
-- ------------------------------------------------------------

create or replace function public.admin_create_user(p_email text, p_password text, p_role text, p_full_name text) returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
declare
  v_uid uuid;
  v_icol text;
begin
  if p_role not in ('manager', 'worker') then
    raise exception 'Недопустимая роль: %', p_role;
  end if;
  select id into v_uid from auth.users where email = lower(p_email);
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, 'authenticated', 'authenticated', lower(p_email), crypt(p_password, gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p_role),
      jsonb_build_object('sub', v_uid::text, 'full_name', p_full_name, 'email', lower(p_email), 'email_verified', true),
      now(), now());
  end if;
  update auth.users
  set aud = 'authenticated', role = 'authenticated',
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p_role),
      updated_at = now()
  where id = v_uid;
  select a.attname into v_icol
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth' and c.relname = 'identities'
    and a.attname in ('user_id', 'auth_user_id')
    and a.attnum > 0 and not a.attisdropped
  order by case a.attname when 'user_id' then 1 else 2 end
  limit 1;
  if v_icol is null then
    raise warning 'В auth.identities нет user_id/auth_user_id — привязка identity пропущена';
  else
    execute format(
      'insert into auth.identities (id, %I, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at) '
      || 'values ($1, $2, $2::text, %L, $3, now(), now(), now()) on conflict do nothing', v_icol, 'email')
      using gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', lower(p_email), 'email_verified', true);
  end if;
  insert into public.profiles (id, role, full_name)
  values (v_uid, p_role, p_full_name)
  on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
  return v_uid;
end;
$fn$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id,
    coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'worker'),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Без имени'))
  on conflict (id) do nothing;
  return new;
end;
$fn$;

-- ------------------------------------------------------------
-- Бизнес-правила задач
-- ------------------------------------------------------------

create or replace function public.validate_task_insert() returns trigger
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
begin
  if auth.uid() is null then
    return new;
  end if;
  if not public.is_manager() then
    raise exception 'Создавать задачи может только постановщик';
  end if;
  if new.status <> 'Новая' then
    raise exception 'Новая задача всегда создаётся со статусом «Новая»';
  end if;
  if new.author_id is distinct from auth.uid() then
    raise exception 'author_id должен соответствовать текущему пользователю';
  end if;
  return new;
end;
$fn$;

create or replace function public.validate_task_update() returns trigger
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
declare
  v_role text := public.current_user_role();
  v_uid uuid := auth.uid();
  v_comment text := nullif(trim(coalesce(current_setting('app.task_action_comment', true), '')), '');
  v_changed boolean;
begin
  if v_uid is null then
    return new;
  end if;
  if new.status is distinct from old.status then
    if new.status not in ('Новая', 'В работе', 'На проверке', 'Принята', 'На доработке') then
      raise exception 'Недопустимый статус: %', new.status;
    end if;
    if old.status = 'На проверке' and new.status = 'На доработке' and v_comment is null then
      raise exception 'При отправке на доработку обязателен комментарий';
    end if;
    if v_role = 'worker' then
      if old.assignee_id is distinct from v_uid then
        raise exception 'Вы не назначены на эту задачу';
      end if;
      if not (((old.status = 'Новая' or old.status = 'На доработке') and new.status = 'В работе')
              or (old.status = 'В работе' and new.status = 'На проверке')) then
        raise exception 'Исполнителю недоступен переход «%» → «%»', old.status, new.status;
      end if;
    elsif v_role = 'manager' then
      if not (old.status = 'На проверке' and new.status in ('Принята', 'На доработке')) then
        raise exception 'Постановщику недоступен переход «%» → «%»', old.status, new.status;
      end if;
    else
      raise exception 'У пользователя нет профиля или неизвестная роль';
    end if;
  end if;
  if v_role = 'worker' then
    v_changed := new.title is distinct from old.title
              or new.description is distinct from old.description
              or new.object_id is distinct from old.object_id
              or new.assignee_id is distinct from old.assignee_id
              or new.author_id is distinct from old.author_id;
    if v_changed or new.status is not distinct from old.status then
      raise exception 'Исполнитель может менять только статус задачи';
    end if;
  end if;
  if v_role = 'manager' and new.author_id is distinct from old.author_id then
    raise exception 'Автор задачи не меняется';
  end if;
  return new;
end;
$fn$;

-- ------------------------------------------------------------
-- Журнал истории: одна запись на каждое изменение статуса
-- ------------------------------------------------------------

create or replace function public.log_task_history() returns trigger
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
declare
  v_uid uuid := auth.uid();
  v_comment text := nullif(trim(coalesce(current_setting('app.task_action_comment', true), '')), '');
begin
  if v_uid is null then
    return null;
  end if;
  perform set_config('app.task_action_comment', '', true);
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'У пользователя нет профиля: история не записана';
  end if;
  insert into public.task_history (task_id, user_id, old_status, new_status, comment)
  values (new.id, v_uid, old.status, new.status, v_comment);
  return null;
end;
$fn$;

create or replace function public.protect_task_history() returns trigger
language plpgsql
as $fn$
begin
  if coalesce(current_setting('app.allow_history_write', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  raise exception 'История задач неизменяема (операция % запрещена)', tg_op;
end;
$fn$;

create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_manager() then
    raise exception 'Менять роль может только постановщик';
  end if;
  return new;
end;
$fn$;

-- ------------------------------------------------------------
-- Привязка триггеров
-- ------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop trigger if exists tasks_before_insert on public.tasks;
create trigger tasks_before_insert before insert on public.tasks for each row execute function public.validate_task_insert();

drop trigger if exists tasks_before_update on public.tasks;
create trigger tasks_before_update before update on public.tasks for each row execute function public.validate_task_update();

drop trigger if exists tasks_log_history on public.tasks;
create trigger tasks_log_history after update of status on public.tasks for each row when (new.status is distinct from old.status) execute function public.log_task_history();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

drop trigger if exists task_history_immutable on public.task_history;
create trigger task_history_immutable before update or delete on public.task_history for each row execute function public.protect_task_history();

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard before update on public.profiles for each row execute function public.protect_profile_role();

-- ------------------------------------------------------------
-- RPC: смена статуса с комментарием (основной путь из фронтенда)
-- ------------------------------------------------------------

create or replace function public.change_task_status(p_task_id uuid, p_new_status text, p_comment text default null) returns public.tasks
language plpgsql security definer set search_path = public, extensions, pg_temp
as $fn$
declare
  v_uid uuid := auth.uid();
  v_row public.tasks;
begin
  if v_uid is null then
    raise exception 'Необходимо войти в систему';
  end if;
  if not exists (select 1 from public.tasks t where t.id = p_task_id) then
    raise exception 'Задача не найдена';
  end if;
  perform set_config('app.task_action_comment', coalesce(p_comment, ''), true);
  update public.tasks set status = p_new_status where id = p_task_id;
  perform set_config('app.task_action_comment', '', true);
  select * into v_row from public.tasks where id = p_task_id;
  return v_row;
end;
$fn$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "objects_manager_all" on public.objects;
create policy "objects_manager_all" on public.objects for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "objects_worker_select" on public.objects;
create policy "objects_worker_select" on public.objects for select to authenticated using (public.is_worker() and public.worker_has_task_on(id));

drop policy if exists "tasks_manager_all" on public.tasks;
create policy "tasks_manager_all" on public.tasks for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "tasks_worker_select" on public.tasks;
create policy "tasks_worker_select" on public.tasks for select to authenticated using (public.is_worker() and assignee_id = auth.uid());

drop policy if exists "tasks_worker_update" on public.tasks;
create policy "tasks_worker_update" on public.tasks for update to authenticated using (public.is_worker() and assignee_id = auth.uid()) with check (public.is_worker() and assignee_id = auth.uid());

drop policy if exists "history_select_participants" on public.task_history;
create policy "history_select_participants" on public.task_history for select to authenticated using (public.can_see_history(task_id));

drop policy if exists "history_no_client_insert" on public.task_history;
create policy "history_no_client_insert" on public.task_history for insert to authenticated with check (false);

-- ------------------------------------------------------------
-- Права
-- ------------------------------------------------------------

revoke all on public.profiles, public.objects, public.tasks, public.task_history from anon;

revoke all on public.profiles, public.objects, public.tasks, public.task_history from authenticated;
grant select, insert, update, delete on public.profiles, public.objects, public.tasks, public.task_history to authenticated;

revoke execute on function public.change_task_status(uuid, text, text) from anon, public;
grant execute on function public.change_task_status(uuid, text, text) to authenticated;

revoke execute on function public.admin_create_user(text, text, text, text) from anon, authenticated, public;
