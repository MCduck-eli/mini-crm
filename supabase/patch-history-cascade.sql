-- ============================================================
-- Патч: удаление задачи или объекта должно работать
-- Запускать одним нажатием Run на уже готовой базе (после schema.sql)
--
-- Что было: триггер protect_task_history блокировал любой DELETE,
-- включая каскадный от tasks/objects. Из-за этого постановщик не мог
-- удалить задачу или объект, по которым уже есть история, хотя ТЗ это
-- разрешает (пункт 2.1).
--
-- Что становится: каскадный DELETE (глубина триггера > 1) разрешён,
-- прямой DELETE или UPDATE журнала клиентом — как и раньше запрещён.
-- Требование ТЗ «историю нельзя подделать через API» сохраняется.
-- Проверки ниже ничего не удаляют: каждое действие откатывается.
-- ============================================================

create or replace function public.protect_task_history() returns trigger
language plpgsql
as $fn$
begin
  if coalesce(current_setting('app.allow_history_write', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'История задач неизменяема (операция % запрещена)', tg_op;
end;
$fn$;

do $do$
declare
  v_task uuid;
  v_object uuid;
  v_probe constant text := 'probe-откат';
begin
  select t.id into v_task from public.tasks t join public.task_history h on h.task_id = t.id limit 1;
  if v_task is not null then
    begin
      execute 'delete from public.task_history where task_id = $1' using v_task;
      raise warning 'НЕ ОЖИДАНИЕ: прямой delete журнала прошёл — триггер или RLS не работает.';
    exception when others then
      raise notice 'OK 1: прямой DELETE из task_history запрещён (%)', sqlerrm;
    end;
    begin
      execute 'update public.task_history set comment = ''подделка'' where task_id = $1' using v_task;
      raise warning 'НЕ ОЖИДАНИЕ: прямой update журнала прошёл.';
    exception when others then
      raise notice 'OK 2: прямой UPDATE журнала запрещён (%)', sqlerrm;
    end;
  end if;
  select o.id into v_object from public.objects o
  join public.tasks t on t.object_id = o.id
  join public.task_history h on h.task_id = t.id
  limit 1;
  if v_object is not null then
    begin
      execute 'delete from public.objects where id = $1' using v_object;
      raise exception '%', v_probe using errcode = 'P0001';
    exception when others then
      if sqlerrm like '%' || v_probe || '%' then
        raise notice 'OK 3: каскадное удаление объекта прошло (изменения отменены, данные целы)';
      else
        raise warning 'НЕ ОЖИДАНИЕ: удаление объекта всё ещё блокируется (%), данные целы', sqlerrm;
      end if;
    end;
  end if;
  raise notice 'Итог (данные не изменены): объектов %, задач %, истории %.',
    (select count(1) from public.objects), (select count(1) from public.tasks), (select count(1) from public.task_history);
end;
$do$;
