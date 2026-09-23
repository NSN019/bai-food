-- =====================================================================
-- BAI FOOD — PATCH ПОВЕРХ УЖЕ УСТАНОВЛЕННОЙ ФИНАЛЬНОЙ МИГРАЦИИ
--
-- Изменяет только:
--   1) серверный расчёт доставки;
--   2) public.create_order_v2 для акции 4 донера -> 4 айрана.
--
-- Не удаляет и не обновляет существующие заказы.
-- Не изменяет таблицы, RLS-политики, авторизацию или старую create_order.
-- Старые строки с зоной «Ауыл / Бактыбай» остаются в истории без изменений.
-- Новые заказы принимают серверное название только «Бақтыбай».
-- =====================================================================

begin;


-- =====================================================================
-- 1. СЕРВЕРНЫЙ РАСЧЁТ ДОСТАВКИ
-- =====================================================================

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

  if nullif(btrim(p_delivery_zone), '') is null then
    raise exception 'delivery zone is required';
  end if;

  v_almaty_time :=
    (p_order_time at time zone 'Asia/Almaty')::time;

  case btrim(p_delivery_zone)
    when 'Бақтыбай' then
      if v_almaty_time < time '17:00:00'
         and p_items_subtotal >= 3000 then
        return 0;
      end if;

      return 500;

    when 'Елтай' then
      return 500;

    when 'Өтенай' then
      return 800;

    when 'СХТ' then
      return 1000;

    when 'Шұбар' then
      return 1500;

    when 'Балпық би' then
      return 2000;

    else
      raise exception 'invalid delivery zone';
  end case;
end;
$$;


-- =====================================================================
-- 2. CREATE_ORDER_V2 С ДВУМЯ НЕЗАВИСИМЫМИ АКЦИЯМИ
-- =====================================================================

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

  v_calculated_subtotal_bigint bigint := 0;
  v_ordinary_subtotal_bigint bigint := 0;
  v_regular_doner_quantity integer := 0;

  v_calculated_subtotal integer;
  v_calculated_delivery_fee integer := 0;
  v_calculated_total_bigint bigint;
  v_calculated_total integer;

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
     or jsonb_array_length(p_items) = 0 then
    raise exception 'items must be a non-empty array';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'too many order items';
  end if;


  -- Клиентские gift items полностью игнорируются.
  -- Все платные позиции нормализуются установленной серверной функцией:
  -- product_id, variant_id, addon_ids, quantity и цена проверяются сервером.

  for v_client_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    if coalesce(v_client_item ->> 'is_gift', 'false') = 'true' then
      continue;
    end if;

    v_item := public.bai_food_normalize_item(v_client_item);

    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_price := (v_item ->> 'price')::integer;

    v_line_total :=
      v_unit_price::bigint * v_quantity::bigint;

    v_calculated_subtotal_bigint :=
      v_calculated_subtotal_bigint + v_line_total;

    if (v_item ->> 'is_promo')::boolean = false then
      v_ordinary_subtotal_bigint :=
        v_ordinary_subtotal_bigint + v_line_total;
    end if;

    -- Считаются только отдельные нормализованные позиции донеров.
    -- Донеры внутри SET/COMBO представлены product_id самого набора
    -- и поэтому в это количество не попадают.

    if v_product_id = any (
      array[
        'doner-chicken',
        'doner-beef',
        'doner-assorti',
        'doner-chicken-15',
        'doner-beef-15',
        'doner-assorti-15'
      ]::text[]
    ) then
      v_regular_doner_quantity :=
        v_regular_doner_quantity + v_quantity;
    end if;

    v_clean_items :=
      v_clean_items || jsonb_build_array(v_item);
  end loop;


  if jsonb_array_length(v_clean_items) = 0 then
    raise exception 'order has no payable items';
  end if;

  if v_calculated_subtotal_bigint > 2147483647 then
    raise exception 'order subtotal is too large';
  end if;

  v_calculated_subtotal :=
    v_calculated_subtotal_bigint::integer;


  -- Акция 1: Pepperoni при обычном subtotal строго больше 10 000 ₸.
  -- SET и COMBO не участвуют. Максимум одна Pepperoni.

  if v_ordinary_subtotal_bigint > 10000 then
    v_clean_items :=
      v_clean_items || jsonb_build_array(
        jsonb_build_object(
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
        )
      );
  end if;


  -- Акция 2: любые 4 или больше отдельно заказанных донера
  -- дают ровно 4 бесплатных айрана.
  -- За 8 донеров второй комплект автоматически не выдаётся.

  if v_regular_doner_quantity >= 4 then
    v_clean_items :=
      v_clean_items || jsonb_build_array(
        jsonb_build_object(
          'product_id', 'gift-ayran-4',
          'name', 'Айран — ПОДАРОК ПО АКЦИИ ×4',
          'quantity', 4,
          'price', 0,
          'variant_id', null,
          'variant', null,
          'addon_ids', jsonb_build_array(),
          'addons', jsonb_build_array(),
          'is_promo', true,
          'is_gift', true
        )
      );
  end if;


  if p_order_type = 'delivery' then
    if nullif(btrim(p_phone), '') is null then
      raise exception 'phone is required for delivery';
    end if;

    if nullif(btrim(p_address), '') is null then
      raise exception 'address is required for delivery';
    end if;

    if nullif(btrim(p_delivery_zone), '') is null then
      raise exception 'delivery zone is required';
    end if;

    v_calculated_delivery_fee :=
      public.bai_food_delivery_fee(
        btrim(p_delivery_zone),
        v_calculated_subtotal,
        v_order_time
      );
  else
    if nullif(btrim(p_table_number), '') is null then
      raise exception 'table_number is required';
    end if;

    p_phone := null;
    p_address := null;
    p_delivery_zone := null;
    v_calculated_delivery_fee := 0;
  end if;


  v_calculated_total_bigint :=
    v_calculated_subtotal::bigint
    + v_calculated_delivery_fee::bigint;

  if v_calculated_total_bigint > 2147483647 then
    raise exception 'order total is too large';
  end if;

  v_calculated_total :=
    v_calculated_total_bigint::integer;


  -- Значения frontend только сверяются с серверным расчётом.

  if p_items_subtotal is distinct from v_calculated_subtotal then
    raise exception
      'items subtotal mismatch: expected %, received %',
      v_calculated_subtotal,
      p_items_subtotal;
  end if;

  if p_delivery_fee is distinct from v_calculated_delivery_fee then
    raise exception
      'delivery fee mismatch: expected %, received %',
      v_calculated_delivery_fee,
      p_delivery_fee;
  end if;

  if p_total is distinct from v_calculated_total then
    raise exception
      'order total mismatch: expected %, received %',
      v_calculated_total,
      p_total;
  end if;


  insert into public.orders (
    customer_name,
    phone,
    order_type,
    table_number,
    address,
    items,
    items_subtotal,
    delivery_zone,
    delivery_fee,
    total,
    payment_method,
    payment_status,
    order_status,
    accepted_at
  )
  values (
    btrim(p_customer_name),
    nullif(btrim(p_phone), ''),
    p_order_type,
    nullif(btrim(p_table_number), ''),
    nullif(btrim(p_address), ''),
    v_clean_items,
    v_calculated_subtotal,
    case
      when p_order_type = 'delivery'
      then btrim(p_delivery_zone)
      else null
    end,
    v_calculated_delivery_fee,
    v_calculated_total,
    p_payment_method,
    'waiting',
    'waiting_payment',
    null
  )
  returning id into v_new_order_id;

  return v_new_order_id;
end;
$$;


-- Вспомогательный расчёт доставки не открывается как публичный RPC.

revoke all on function public.bai_food_delivery_fee(
  text,
  integer,
  timestamptz
) from public, anon, authenticated;


-- Доступ к create_order_v2 сохраняется для оформления заказов.

revoke all on function public.create_order_v2(
  text,
  text,
  text,
  text,
  text,
  jsonb,
  integer,
  text,
  integer,
  integer,
  text
) from public;

grant execute on function public.create_order_v2(
  text,
  text,
  text,
  text,
  text,
  jsonb,
  integer,
  text,
  integer,
  integer,
  text
) to anon, authenticated;


commit;
