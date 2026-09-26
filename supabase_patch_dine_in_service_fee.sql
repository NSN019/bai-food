-- BAI FOOD — incremental patch: 10% dine-in service fee
-- Run ONLY after supabase_patch_stop_lagman_fish.sql.
-- Does not delete or rewrite historical orders.

begin;

alter table public.orders
  add column if not exists service_fee integer not null default 0;

alter table public.orders
  drop constraint if exists orders_service_fee_nonnegative;

alter table public.orders
  add constraint orders_service_fee_nonnegative check (service_fee >= 0) not valid;

alter table public.orders validate constraint orders_service_fee_nonnegative;

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
  v_service_fee integer := 0;
  v_total_bigint bigint;
  v_total integer;
  v_order_time timestamptz := clock_timestamp();
  v_is_stopped boolean;
begin
  if nullif(btrim(p_customer_name), '') is null then raise exception 'customer_name is required'; end if;
  if p_order_type not in ('dine_in','delivery') then raise exception 'invalid order_type'; end if;
  if p_payment_method not in ('cash','kaspi') then raise exception 'invalid payment_method'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'items must be a non-empty array with at most 100 rows';
  end if;

  for v_client_item in select value from jsonb_array_elements(p_items)
  loop
    -- Клиентский gift всегда игнорируется; подарки формирует только сервер.
    if coalesce(v_client_item ->> 'is_gift','false') = 'true' then continue; end if;

    v_item := public.bai_food_normalize_item(v_client_item);
    v_product_id := v_item ->> 'product_id';

    -- FOR SHARE сериализует заказ с одновременным STOP update этой строки.
    select pa.is_stopped into v_is_stopped
    from public.product_availability pa
    where pa.product_id = v_product_id
    for share;

    if not found then raise exception 'product is not registered: %', v_product_id; end if;
    if v_is_stopped then
      raise exception 'product temporarily unavailable: %', v_product_id;
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_price := (v_item ->> 'price')::integer;
    v_line_total := v_unit_price::bigint * v_quantity::bigint;
    v_subtotal_bigint := v_subtotal_bigint + v_line_total;
    if (v_item ->> 'is_promo')::boolean = false then
      v_ordinary_subtotal_bigint := v_ordinary_subtotal_bigint + v_line_total;
    end if;
    if v_product_id = any(array[
      'doner-chicken','doner-beef','doner-assorti',
      'doner-chicken-15','doner-beef-15','doner-assorti-15'
    ]::text[]) then
      v_doner_quantity := v_doner_quantity + v_quantity;
    end if;
    v_clean_items := v_clean_items || jsonb_build_array(v_item);
  end loop;

  if jsonb_array_length(v_clean_items) = 0 then raise exception 'order has no payable items'; end if;
  if v_subtotal_bigint > 2147483647 then raise exception 'order subtotal is too large'; end if;
  v_subtotal := v_subtotal_bigint::integer;

  if v_ordinary_subtotal_bigint > 10000 then
    select pa.is_stopped into v_is_stopped
    from public.product_availability pa
    where pa.product_id = 'pizza-pepperoni'
    for share;
    if coalesce(v_is_stopped,false) then
      raise exception 'product temporarily unavailable: pizza-pepperoni';
    end if;
    v_clean_items := v_clean_items || jsonb_build_array(jsonb_build_object(
      'product_id','gift-pepperoni','name','Пепперони — ПОДАРОК ПО АКЦИИ',
      'quantity',1,'price',0,'variant_id',null,'variant',null,
      'addon_ids',jsonb_build_array(),'addons',jsonb_build_array(),
      'is_promo',true,'is_gift',true
    ));
  end if;

  v_free_ayran_quantity := (v_doner_quantity / 4) * 4;
  if v_free_ayran_quantity > 0 then
    select pa.is_stopped into v_is_stopped
    from public.product_availability pa
    where pa.product_id = 'ayran'
    for share;
    if coalesce(v_is_stopped,false) then
      raise exception 'product temporarily unavailable: ayran';
    end if;
    v_clean_items := v_clean_items || jsonb_build_array(jsonb_build_object(
      'product_id','gift-ayran','name','Айран — ПОДАРОК ПО АКЦИИ ×' || v_free_ayran_quantity,
      'quantity',v_free_ayran_quantity,'price',0,'variant_id',null,'variant',null,
      'addon_ids',jsonb_build_array(),'addons',jsonb_build_array(),
      'is_promo',true,'is_gift',true
    ));
  end if;

  if p_order_type = 'delivery' then
    if nullif(btrim(p_phone),'') is null or nullif(btrim(p_address),'') is null or nullif(btrim(p_delivery_zone),'') is null then
      raise exception 'delivery details are required';
    end if;
    v_delivery_fee := public.bai_food_delivery_fee(btrim(p_delivery_zone),v_subtotal,v_order_time);
  else
    if nullif(btrim(p_table_number),'') is null then raise exception 'table_number is required'; end if;
    p_phone := null; p_address := null; p_delivery_zone := null; v_delivery_fee := 0;
    v_service_fee := round(v_subtotal::numeric * 0.10)::integer;
  end if;

  v_total_bigint := v_subtotal::bigint + v_delivery_fee::bigint + v_service_fee::bigint;
  if v_total_bigint > 2147483647 then raise exception 'order total is too large'; end if;
  v_total := v_total_bigint::integer;
  if p_items_subtotal is distinct from v_subtotal or p_delivery_fee is distinct from v_delivery_fee or p_total is distinct from v_total then
    raise exception 'client totals do not match server totals';
  end if;

  if p_payment_method = 'kaspi' then
    p_cash_change_mode := null; p_cash_change_from := null;
  else
    p_cash_change_mode := coalesce(p_cash_change_mode,'none');
    if p_cash_change_mode not in ('none','change') then raise exception 'invalid cash change mode'; end if;
    if p_cash_change_mode = 'none' then p_cash_change_from := null;
    elsif p_cash_change_from is null or p_cash_change_from < v_total then
      raise exception 'cash change amount must be at least order total';
    end if;
  end if;

  insert into public.orders (
    customer_name,phone,order_type,table_number,address,items,items_subtotal,
    delivery_zone,delivery_fee,service_fee,total,payment_method,payment_status,order_status,
    accepted_at,prep_minutes,cash_change_mode,cash_change_from
  ) values (
    btrim(p_customer_name),nullif(btrim(p_phone),''),p_order_type,
    nullif(btrim(p_table_number),''),nullif(btrim(p_address),''),v_clean_items,
    v_subtotal,case when p_order_type='delivery' then btrim(p_delivery_zone) else null end,
    v_delivery_fee,v_service_fee,v_total,p_payment_method,'waiting','waiting_payment',null,null,
    p_cash_change_mode,p_cash_change_from
  ) returning id into v_new_order_id;
  return v_new_order_id;
end;
$$;


revoke all on function public.bai_food_create_order_core(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) from public, anon, authenticated;

commit;
