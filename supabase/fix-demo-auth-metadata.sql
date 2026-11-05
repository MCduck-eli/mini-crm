-- ============================================================
-- Починить GoTrue-метаданные демо-пользователей
-- Запускать ПОСЛЕ schema.sql и seed.sql, целиком одним нажатием Run
--
-- Причина: admin_create_user вставлял строку в auth.identities с
-- колонкой auth_user_id и молча глотал ошибку. В Supabase эта колонка
-- называется user_id, поэтому у демо-аккаунтов записи identities
-- отсутствуют — без них GoTrue не пускает пользователя по паролю,
-- даже если хеш пароля правильный.
-- ============================================================

create or replace function public.fix_demo_auth_metadata() returns void
language plpgsql security definer set search_path = public, extensions, pg_temp
as $do$
declare
  v_col text;
  r record;
  v_cnt int;
begin
  select a.attname into v_col
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth' and c.relname = 'identities'
    and a.attname in ('user_id', 'auth_user_id')
    and a.attnum > 0 and not a.attisdropped
  order by case a.attname when 'user_id' then 1 else 2 end
  limit 1;
  if v_col is null then
    raise warning 'В auth.identities нет колонки user_id/auth_user_id — привязка пропущена.';
    return;
  end if;
  raise notice 'будет использована колонка auth.identities.%', v_col;
  for r in
    select u.id, lower(u.email) as email
    from auth.users u
    where lower(u.email) in ('manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru')
    order by 1
  loop
    execute format(
      'insert into auth.identities (id, %I, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at) '
      || 'values (extensions.gen_random_uuid(), $1, $1::text, %L, $2, now(), now(), now()) on conflict do nothing',
      v_col, 'email')
      using r.id, jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true);
    execute format('select count(1) from auth.identities where %I = $1', v_col) into v_cnt using r.id;
    raise notice '%: запись в identities %', r.email, case when v_cnt > 0 then 'есть' else 'НЕ создана' end;
  end loop;
  update auth.users u
  set aud = 'authenticated',
      role = 'authenticated',
      is_sso_user = false,
      raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
        - 'role'
        || jsonb_build_object('role', coalesce(p.role, 'worker')),
      updated_at = now()
  from public.profiles p
  where u.id = p.id
    and lower(u.email) in ('manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru');
  raise notice 'Аудит: %', (
    select string_agg(x, ' | ' order by x)
    from (
      select lower(u.email) || ': aud=' || coalesce(u.aud, '-')
             || ' role=' || coalesce(u.role, '-')
             || ' app_role=' || coalesce(u.raw_app_meta_data ->> 'role', '-')
             || ' sso=' || coalesce(u.is_sso_user::text, '-')
      from auth.users u
      where lower(u.email) in ('manager@stroyka.ru', 'worker1@stroyka.ru', 'worker2@stroyka.ru')
    ) t(x)
  );
  raise notice 'Попробуйте войти: manager@stroyka.ru / manager123';
end;
$do$;

select public.fix_demo_auth_metadata();

drop function public.fix_demo_auth_metadata();
