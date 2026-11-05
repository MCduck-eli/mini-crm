-- ============================================================
-- Второй исполнитель и его задачи
-- ТЗ требует минимум одного постановщика и ДВУХ исполнителей.
--
-- ПОРЯДОК:
-- 1) Supabase Dashboard → Authentication → Add user:
--      email  builder2@stroyka.ru
--      пароль worker123
--      флаг «Auto Confirm User» включить.
-- 2) Выполнить этот файл ПОЛНОСТЬЮ, одним нажатием Run, в SQL Editor.
--
-- Скрипт идемпотентен: повторный запуск не создаёт дублей.
-- ============================================================

do $do$
declare
  v_worker_email  constant text := 'builder2@stroyka.ru';
  v_worker_name   constant text := 'Прораб Петров П.П.';
  v_manager_email constant text := 'boss@stroyka.ru';
  v_wid uuid;
  v_mid uuid;
  v_obj uuid;
  v_task uuid;
  v_pos int;
  r record;
  v_new int := 0;
begin
  select u.id into v_wid from auth.users u where lower(u.email) = v_worker_email;
  if v_wid is null then
    raise exception 'Пользователь % не найден в auth.users. Сначала создайте его в Dashboard (Add user + Auto Confirm).', v_worker_email;
  end if;
  select p.id into v_mid from public.profiles p join auth.users u on u.id = p.id where lower(u.email) = v_manager_email;
  if v_mid is null then
    raise exception 'Профиль постановщика % не найден.', v_manager_email;
  end if;

  insert into public.profiles (id, role, full_name)
  values (v_wid, 'worker', v_worker_name)
  on conflict (id) do update set role = 'worker', full_name = excluded.full_name;

  if exists (select 1 from pg_attribute where attrelid = 'auth.identities'::regclass and attname = 'user_id' and attnum > 0 and not attisdropped) then
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    select gen_random_uuid(), v_wid, v_wid::text, 'email',
           jsonb_build_object('sub', v_wid::text, 'email', v_worker_email, 'email_verified', true), now(), now(), now()
    where not exists (select 1 from auth.identities i where i.user_id = v_wid and i.provider = 'email')
    on conflict do nothing;
  else
    raise warning 'Колонка auth.identities.user_id не найдена — identity не трогали.';
  end if;

  for r in
    select t.title::text as title, t.descr::text as descr, t.st::text as st, t.idx::int as idx
    from (values
      ('Смонтировать электрощиток',  'Установить и подключить щиток по проекту.',            'Новая',       1),
      ('Штукатурка стен, 2 этаж',    'Выровнять стены под маяки, слой до 30 мм.',            'В работе',    2),
      ('Уложить плитку в холле',     'Плитка 600x600, затирка в цвет, уровень по лазеру.',    'На проверке', 3)
    ) as t(title, descr, st, idx)
  loop
    if exists (select 1 from public.tasks x where x.assignee_id = v_wid and x.title = r.title) then
      raise notice 'Пропуск (уже есть): %', r.title;
      continue;
    end if;
    select o.id into v_obj from (select id, row_number() over (order by created_at) as rn from public.objects) o
    where o.rn = least(r.idx, (select count(1)::int from public.objects));
    if v_obj is null then
      select id into v_obj from public.objects order by created_at limit 1;
    end if;

    insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
    values (r.title, r.descr, v_obj, v_wid, v_mid, r.st)
    returning id into v_task;
    v_new := v_new + 1;

    insert into public.task_history (task_id, user_id, old_status, new_status, comment)
    values (v_task, v_mid, null, 'Новая', 'Задача поставлена (демо-данные)');
    if r.st in ('В работе', 'На проверке', 'Принята', 'На доработке') then
      insert into public.task_history (task_id, user_id, old_status, new_status, comment)
      values (v_task, v_wid, 'Новая', 'В работе', null);
    end if;
    if r.st in ('На проверке', 'Принята') then
      insert into public.task_history (task_id, user_id, old_status, new_status, comment)
      values (v_task, v_wid, 'В работе', 'На проверке', 'Готово, прошу принять.');
    end if;
    if r.st = 'Принята' then
      insert into public.task_history (task_id, user_id, old_status, new_status, comment)
      values (v_task, v_mid, 'На проверке', 'Принята', 'Принято без замечаний.');
    end if;
    raise notice 'Создано: «%» → статус «%»', r.title, r.st;
  end loop;

  select count(1) into v_pos from public.profiles where role = 'worker';
  raise notice '------------------------------------------------------------';
  raise notice 'Исполнителей в системе: % (новых задач создано: %)', v_pos, v_new;
  raise notice 'Задач у %: %', v_worker_email, (select count(1) from public.tasks where assignee_id = v_wid);
  raise notice 'Всего объектов %, задач %, записей истории %.',
    (select count(1) from public.objects), (select count(1) from public.tasks), (select count(1) from public.task_history);
  raise notice 'Вход: boss@stroyka.ru / manager123 · builder1@stroyka.ru / worker123 · builder2@stroyka.ru / worker123';
end;
$do$;
