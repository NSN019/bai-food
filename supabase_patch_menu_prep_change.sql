-- =====================================================================
-- BAI FOOD — PATCH: МЕНЮ, ВРЕМЯ ПРИГОТОВЛЕНИЯ, СДАЧА, AYRAN
-- Выполняется поверх ранее установленной финальной миграции и patch зон.
-- Не удаляет и не изменяет существующие заказы. Не меняет RLS/staff/auth.
-- =====================================================================

begin;

alter table public.orders
  add column if not exists prep_minutes smallint,
  add column if not exists cash_change_mode text,
  add column if not exists cash_change_from integer,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_comment text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_prep_minutes_allowed'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_prep_minutes_allowed
      check (prep_minutes is null or prep_minutes in (20, 30, 40))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_cash_change_mode_allowed'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_cash_change_mode_allowed
      check (cash_change_mode is null or cash_change_mode in ('none', 'change'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_cash_change_from_nonnegative'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_cash_change_from_nonnegative
      check (cash_change_from is null or cash_change_from >= 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_cancellation_reason_allowed'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_cancellation_reason_allowed
      check (cancellation_reason is null or cancellation_reason in (
        'stop_list', 'no_ingredients', 'unreachable', 'other'
      ))
      not valid;
  end if;
end
$$;


-- Только четыре зоны для новых заказов.
-- Исторические СХТ/Шұбар в orders не изменяются.

create or replace function public.bai_food_delivery_fee(
  p_delivery_zone text,
  p_items_subtotal integer,
  p_order_time timestamptz default clock_timestamp()
)
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_almaty_time time;
begin
  if p_items_subtotal is null or p_items_subtotal < 0 then
    raise exception 'invalid items subtotal';
  end if;

  v_almaty_time := (p_order_time at time zone 'Asia/Almaty')::time;

  case btrim(p_delivery_zone)
    when 'Бақтыбай' then
      if v_almaty_time < time '17:00:00' and p_items_subtotal >= 3000 then
        return 0;
      end if;
      return 500;
    when 'Елтай' then return 500;
    when 'Өтенай' then return 800;
    when 'Балпық би' then return 2000;
    else raise exception 'invalid delivery zone';
  end case;
end;
$$;


-- Внутренняя единая реализация заказа.

create or replace function public.bai_food_create_order_core(
  p_customer_name text,
  p_phone text,
  p_order_type text,
  p_table_number text,
  p_address text,
  p_items jsonb,
  p_items_subtotal integer,
  p_delivery_zone text,
  p_delivery_fee integer,
  p_total integer,
  p_payment_method text,
  p_cash_change_mode text,
  p_cash_change_from integer
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_order_id bigint;
  v_client_item jsonb;
  v_item jsonb;
  v_clean_items jsonb := '[]'::jsonb;
  v_product_id text;
  v_quantity integer;
  v_unit_price integer;
  v_line_total bigint;
  v_subtotal_bigint bigint := 0;
  v_ordinary_subtotal_bigint bigint := 0;
  v_doner_quantity integer := 0;
  v_free_ayran_quantity integer := 0;
  v_subtotal integer;
  v_delivery_fee integer := 0;
  v_total_bigint bigint;
  v_total integer;
  v_order_time timestamptz := clock_timestamp();
begin
  if nullif(btrim(p_customer_name), '') is null then
    raise exception 'customer_name is required';
  end if;

  if p_order_type not in ('dine_in', 'delivery') then
    raise exception 'invalid order_type';
  end if;

  if p_payment_method not in ('cash', 'kaspi') then
    raise exception 'invalid payment_method';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 100 then
    raise exception 'items must be a non-empty array with at most 100 rows';
  end if;

  for v_client_item in
    select value from jsonb_array_elements(p_items)
  loop
    -- Любой клиентский подарок игнорируется и не нормализуется.
    if coalesce(v_client_item ->> 'is_gift', 'false') = 'true' then
      continue;
    end if;

    v_product_id := nullif(btrim(v_client_item ->> 'product_id'), '');

    -- Удалённые позиции запрещены сервером, а не только скрыты во frontend.
    if v_product_id = any (array[
      'super-combo',
      'pizza-time',
      'fries-large',
      'fries-small',
      'pizza-ranch',
      'pizza-pepperoni-x2',
      'pizza-pepperoni-cheese',
      'pizza-hunter-cheese'
    ]::text[]) then
      raise exception 'product is no longer available: %', v_product_id;
    end if;

    -- Все pizza addons запрещены. Пустой или отсутствующий addon_ids допустим.
    if v_product_id like 'pizza-%'
       and v_client_item ? 'addon_ids'
       and (
         jsonb_typeof(v_client_item -> 'addon_ids') <> 'array'
         or jsonb_array_length(v_client_item -> 'addon_ids') > 0
       ) then
      raise exception 'pizza addons are not allowed';
    end if;

    -- Установленная ранее функция проверяет product/variant/addons/price
    -- и формирует достоверные name, variant и addons для кассы.
    v_item := public.bai_food_normalize_item(v_client_item);
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_price := (v_item ->> 'price')::integer;
    v_line_total := v_unit_price::bigint * v_quantity::bigint;

    v_subtotal_bigint := v_subtotal_bigint + v_line_total;

    if (v_item ->> 'is_promo')::boolean = false then
      v_ordinary_subtotal_bigint := v_ordinary_subtotal_bigint + v_line_total;
    end if;

    if v_product_id = any (array[
      'doner-chicken', 'doner-beef', 'doner-assorti',
      'doner-chicken-15', 'doner-beef-15', 'doner-assorti-15'
    ]::text[]) then
      v_doner_quantity := v_doner_quantity + v_quantity;
    end if;

    v_clean_items := v_clean_items || jsonb_build_array(v_item);
  end loop;

  if jsonb_array_length(v_clean_items) = 0 then
    raise exception 'order has no payable items';
  end if;

  if v_subtotal_bigint > 2147483647 then
    raise exception 'order subtotal is too large';
  end if;
  v_subtotal := v_subtotal_bigint::integer;

  -- Pepperoni: строго больше 10 000 обычных товаров.
  if v_ordinary_subtotal_bigint > 10000 then
    v_clean_items := v_clean_items || jsonb_build_array(jsonb_build_object(
      'product_id', 'gift-pepperoni',
      'name', 'Пепперони — ПОДАРОК ПО АКЦИИ',
      'quantity', 1,
      'price', 0,
      'variant_id', null,
      'variant', null,
      'addon_ids', jsonb_build_array(),
      'addons', jsonb_build_array(),
      'is_promo', true,
      'is_gift', true
    ));
  end if;

  -- Ayran: floor(обычные донеры / 4) * 4.
  v_free_ayran_quantity := (v_doner_quantity / 4) * 4;

  if v_free_ayran_quantity > 0 then
    v_clean_items := v_clean_items || jsonb_build_array(jsonb_build_object(
      'product_id', 'gift-ayran',
      'name', 'Айран — ПОДАРОК ПО АКЦИИ ×' || v_free_ayran_quantity,
      'quantity', v_free_ayran_quantity,
      'price', 0,
      'variant_id', null,
      'variant', null,
      'addon_ids', jsonb_build_array(),
      'addons', jsonb_build_array(),
      'is_promo', true,
      'is_gift', true
    ));
  end if;

  if p_order_type = 'delivery' then
    if nullif(btrim(p_phone), '') is null
       or nullif(btrim(p_address), '') is null
       or nullif(btrim(p_delivery_zone), '') is null then
      raise exception 'delivery details are required';
    end if;

    v_delivery_fee := public.bai_food_delivery_fee(
      btrim(p_delivery_zone), v_subtotal, v_order_time
    );
  else
    if nullif(btrim(p_table_number), '') is null then
      raise exception 'table_number is required';
    end if;
    p_phone := null;
    p_address := null;
    p_delivery_zone := null;
    v_delivery_fee := 0;
  end if;

  v_total_bigint := v_subtotal::bigint + v_delivery_fee::bigint;
  if v_total_bigint > 2147483647 then
    raise exception 'order total is too large';
  end if;
  v_total := v_total_bigint::integer;

  if p_items_subtotal is distinct from v_subtotal
     or p_delivery_fee is distinct from v_delivery_fee
     or p_total is distinct from v_total then
    raise exception 'client totals do not match server totals';
  end if;

  if p_payment_method = 'kaspi' then
    p_cash_change_mode := null;
    p_cash_change_from := null;
  else
    p_cash_change_mode := coalesce(p_cash_change_mode, 'none');

    if p_cash_change_mode not in ('none', 'change') then
      raise exception 'invalid cash change mode';
    end if;

    if p_cash_change_mode = 'none' then
      p_cash_change_from := null;
    elsif p_cash_change_from is null or p_cash_change_from < v_total then
      raise exception 'cash change amount must be at least order total';
    end if;
  end if;

  insert into public.orders (
    customer_name, phone, order_type, table_number, address,
    items, items_subtotal, delivery_zone, delivery_fee, total,
    payment_method, payment_status, order_status, accepted_at,
    prep_minutes, cash_change_mode, cash_change_from
  ) values (
    btrim(p_customer_name), nullif(btrim(p_phone), ''), p_order_type,
    nullif(btrim(p_table_number), ''), nullif(btrim(p_address), ''),
    v_clean_items, v_subtotal,
    case when p_order_type = 'delivery' then btrim(p_delivery_zone) else null end,
    v_delivery_fee, v_total, p_payment_method, 'waiting', 'waiting_payment', null,
    null, p_cash_change_mode, p_cash_change_from
  ) returning id into v_new_order_id;

  return v_new_order_id;
end;
$$;


-- Старая сигнатура сохраняется для уже опубликованных клиентов.

create or replace function public.create_order_v2(
  p_customer_name text,
  p_phone text,
  p_order_type text,
  p_table_number text,
  p_address text,
  p_items jsonb,
  p_items_subtotal integer,
  p_delivery_zone text,
  p_delivery_fee integer,
  p_total integer,
  p_payment_method text
)
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.bai_food_create_order_core(
    p_customer_name, p_phone, p_order_type, p_table_number, p_address,
    p_items, p_items_subtotal, p_delivery_zone, p_delivery_fee, p_total,
    p_payment_method, null, null
  );
$$;


-- Новая перегрузка сохраняет информацию о сдаче.

create or replace function public.create_order_v2(
  p_customer_name text,
  p_phone text,
  p_order_type text,
  p_table_number text,
  p_address text,
  p_items jsonb,
  p_items_subtotal integer,
  p_delivery_zone text,
  p_delivery_fee integer,
  p_total integer,
  p_payment_method text,
  p_cash_change_mode text,
  p_cash_change_from integer
)
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.bai_food_create_order_core(
    p_customer_name, p_phone, p_order_type, p_table_number, p_address,
    p_items, p_items_subtotal, p_delivery_zone, p_delivery_fee, p_total,
    p_payment_method, p_cash_change_mode, p_cash_change_from
  );
$$;


-- Кассир может отклонить только ещё не принятый активный заказ.
-- SECURITY INVOKER сохраняет действующую RLS и права кассира на orders.

create or replace function public.cancel_order_v2(
  p_order_id bigint,
  p_reason text,
  p_comment text default null
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_comment text;
begin
  if p_reason is null or p_reason not in (
    'stop_list', 'no_ingredients', 'unreachable', 'other'
  ) then
    raise exception 'invalid cancellation reason';
  end if;

  v_comment := case
    when p_reason = 'other' then nullif(left(btrim(coalesce(p_comment, '')), 500), '')
    else null
  end;

  update public.orders
  set order_status = 'cancelled',
      cancelled_at = clock_timestamp(),
      cancellation_reason = p_reason,
      cancellation_comment = v_comment
  where id = p_order_id
    and accepted_at is null
    and cancelled_at is null
    and order_status in ('waiting_payment', 'waiting', 'new', 'pending');

  if not found then
    raise exception 'order cannot be cancelled';
  end if;

  return true;
end;
$$;


-- Ограниченный статус для клиента: без внутренних данных кассы.
-- Для доставки требуется точное совпадение телефона, для заведения — стола.

drop function if exists public.get_order_status_v2(bigint,text,text,text);

create function public.get_order_status_v2(
  p_order_id bigint,
  p_customer_name text,
  p_phone text,
  p_table_number text
)
returns table (
  accepted_at timestamptz,
  prep_minutes smallint,
  order_status text,
  public_message text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    o.accepted_at,
    o.prep_minutes,
    o.order_status,
    case when o.order_status = 'cancelled'
      then 'Кассир свяжется с вами для уточнения.'
      else null
    end as public_message
  from public.orders o
  where o.id = p_order_id
    and o.customer_name = btrim(p_customer_name)
    and (
      (o.order_type = 'delivery' and o.phone = nullif(btrim(p_phone), ''))
      or
      (o.order_type = 'dine_in' and o.table_number::text = nullif(btrim(p_table_number), ''))
    )
  limit 1;
$$;


revoke all on function public.bai_food_create_order_core(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) from public, anon, authenticated;

revoke all on function public.bai_food_delivery_fee(text,integer,timestamptz)
  from public, anon, authenticated;

revoke all on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text
) from public;
grant execute on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text
) to anon, authenticated;

revoke all on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) from public;
grant execute on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) to anon, authenticated;

revoke all on function public.get_order_status_v2(bigint,text,text,text)
  from public;
grant execute on function public.get_order_status_v2(bigint,text,text,text)
  to anon, authenticated;

revoke all on function public.cancel_order_v2(bigint,text,text)
  from public, anon;
grant execute on function public.cancel_order_v2(bigint,text,text)
  to authenticated;

commit;
