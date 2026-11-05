-- ============================================================
-- Починить входы демо-пользователей
-- Запускать ПОСЛЕ schema.sql и seed.sql, целиком одним нажатием Run
--
-- Причина: если аккаунт с таким email уже существовал в auth.users
-- (например, создан вручную в Dashboard), admin_create_user не
-- перезаписывал пароль и не правил роль — вход не работал.
-- ============================================================

create or replace function public.fix_demo_logins() returns void
language plpgsql security definer set search_path = public, extensions, pg_temp
as $do$
declare
  r record;
  v_fixed int := 0;
begin
  update auth.users
  set encrypted_password = crypt(
        case when lower(email) = 'manager@stroyka.ru' then 'manager123' else 'worker123' end,
        gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where lower(email) in ('manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru');
  get diagnostics v_fixed = row_count;
  if exists (select 1 from pg_attribute a
             join pg_class c on c.oid = a.attrelid
             join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'auth' and c.relname = 'users'
               and a.attname = 'banned_until' and a.attnum > 0 and not a.attisdropped) then
    execute format('update auth.users set banned_until = null where lower(email) in (%L, %L, %L)',
      'manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru');
  end if;
  insert into public.profiles (id, role, full_name)
  select u.id,
    case when lower(u.email) = 'manager@stroyka.ru' then 'manager' else 'worker' end,
    coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'Без имени')
  from auth.users u
  where lower(u.email) in ('manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru')
  on conflict (id) do update set role = excluded.role;
  for r in
    select lower(u.email) as email, length(u.encrypted_password) as hash_len,
           left(u.encrypted_password, 4) as hash_prefix,
           (select p.role from public.profiles p where p.id = u.id) as role
    from auth.users u
    where lower(u.email) in ('manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru')
    order by 1
  loop
    raise notice 'аккаунт %: хеш пароля % символов (префикс %), роль профиля: %', r.email, r.hash_len, r.hash_prefix, r.role;
  end loop;
  if v_fixed = 0 then
    raise warning 'Ни один аккаунт не найден — проверьте email в Authentication → Users.';
  else
    raise notice 'Готово: обновлено аккаунтов: %. Вход: manager@stroyka.ru / manager123, worker1@stroyka.ru и worker2@stroyka.ru / worker123', v_fixed;
  end if;
end;
$do$;

select public.fix_demo_logins();

drop function public.fix_demo_logins();
