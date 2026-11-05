-- ============================================================
-- Mini-CRM "Объекты и задачи" — демо-данные
-- Запускать ПОСЛЕ schema.sql, целиком, одним нажатием Run
--
-- Вход в приложение:
--   manager@stroyka.ru / manager123  — постановщик
--   worker1@stroyka.ru / worker123   — исполнитель
--   worker2@stroyka.ru / worker123   — исполнитель
-- ============================================================

create or replace function public.seed_demo_data() returns void
language plpgsql security definer set search_path = public, extensions, pg_temp
as $do$
declare
  v_manager uuid;
  v_worker1 uuid;
  v_worker2 uuid;
  v_obj1 uuid;
  v_obj2 uuid;
  v_obj3 uuid;
  v_task1 uuid;
  v_task2 uuid;
  v_task3 uuid;
  v_task4 uuid;
  v_task5 uuid;
  v_task6 uuid;
begin
  v_manager := public.admin_create_user('manager@stroyka.ru', 'manager123', 'manager', 'Игорь Петрович Соколов');
  v_worker1 := public.admin_create_user('worker1@stroyka.ru', 'worker123', 'worker', 'Алексей Николаевич Иванов');
  v_worker2 := public.admin_create_user('worker2@stroyka.ru', 'worker123', 'worker', 'Дмитрий Сергеевич Кузнецов');
  if exists (select 1 from public.objects) then
    raise notice 'Объекты уже существуют — демо-данные не добавлены повторно.';
    return;
  end if;
  insert into public.objects (name, address) values ('ЖК «Северная звезда», корпус 3', 'г. Москва, ул. Кронштадтская, 14')
  returning id into v_obj1;
  insert into public.objects (name, address) values ('БЦ «Меридиан», 5 этаж', 'г. Москва, Ленинградский пр-т, 39, стр. 2')
  returning id into v_obj2;
  insert into public.objects (name, address) values ('Частный дом, пос. Лесные дали', 'Московская обл., Одинцовский р-н, пос. Лесные дали, уч. 17')
  returning id into v_obj3;
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
  values ('Смонтировать стояки отопления, 3 подъезд', 'Установка стояков отопления от подвала до 9 этажа, опрессовка.', v_obj1, v_worker1, v_manager, 'Принята')
  returning id into v_task1;
  insert into public.task_history (task_id, user_id, old_status, new_status, comment, created_at) values
    (v_task1, v_worker1, 'Новая', 'В работе', null, now() - interval '6 days'),
    (v_task1, v_worker1, 'В работе', 'На проверке', 'Стояки смонтированы, опрессовка пройдена, акт приложен.', now() - interval '2 days'),
    (v_task1, v_manager, 'На проверке', 'Принята', null, now() - interval '1 day');
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
  values ('Развести электрику по 12 этажу', 'Прокладка кабельных линий, установка подрозетников, маркировка щита.', v_obj2, v_worker2, v_manager, 'В работе')
  returning id into v_task2;
  insert into public.task_history (task_id, user_id, old_status, new_status, comment, created_at)
  values (v_task2, v_worker2, 'Новая', 'В работе', null, now() - interval '3 days');
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
  values ('Штукатурка стен гаражного уровня', 'Машинная штукатурка, слой до 30 мм, площадь 420 м².', v_obj1, v_worker2, v_manager, 'На проверке')
  returning id into v_task3;
  insert into public.task_history (task_id, user_id, old_status, new_status, comment, created_at) values
    (v_task3, v_worker2, 'Новая', 'В работе', null, now() - interval '5 days'),
    (v_task3, v_worker2, 'В работе', 'На проверке', 'Работы выполнены полностью, ждут приёмки.', now() - interval '4 hours');
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
  values ('Устройство стяжки во дворе дома', 'Армированная стяжка 60 мм под нагрузку спецтехники.', v_obj3, v_worker1, v_manager, 'На доработке')
  returning id into v_task4;
  insert into public.task_history (task_id, user_id, old_status, new_status, comment, created_at) values
    (v_task4, v_worker1, 'Новая', 'В работе', null, now() - interval '8 days'),
    (v_task4, v_worker1, 'В работе', 'На проверке', 'Стяжка залита, набрал 7 дней.', now() - interval '2 days'),
    (v_task4, v_manager, 'На проверке', 'На доработке', 'Трещины по периметру деформационных швов, перепад до 12 мм. Переделать участок у ворот.', now() - interval '1 day');
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
  values ('Согласовать проект электромонтажа с заказчиком', 'Получить подпись по разделу ЭМ, скорректировать схему освещения.', v_obj2, null, v_manager, 'Новая')
  returning id into v_task5;
  insert into public.tasks (title, description, object_id, assignee_id, author_id, status)
  values ('Смонтировать гипсокартонные перегородки, офис 501', 'Двойной каркас, звукоизоляция 50 мм, две двери.', v_obj2, v_worker1, v_manager, 'Новая')
  returning id into v_task6;
  raise notice 'Готово: 3 объекта, 6 задач, 3 пользователя.';
end;
$do$;

select public.seed_demo_data();

drop function public.seed_demo_data();
