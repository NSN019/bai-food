-- BAI FOOD: доставка + отдельный статус принятия заказа
-- Без удаления или переименования существующих данных/RPC.
begin;

alter table public.orders
  add column if not exists items_subtotal integer,
  add column if not exists delivery_zone text,
  add column if not exists delivery_fee integer not null default 0,
  add column if not exists accepted_at timestamptz;

-- Старые заказы считаем уже обработанными, чтобы после миграции касса
-- не начала звонить по всей истории. Их статусы оплаты не меняются.
update public.orders
set accepted_at = coalesce(paid_at, created_at)
where accepted_at is null;

update public.orders
set items_subtotal = greatest(0, total - coalesce(delivery_fee, 0))
where items_subtotal is null;

alter table public.orders
  alter column items_subtotal set default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_delivery_fee_nonnegative'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_delivery_fee_nonnegative
      check (delivery_fee >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_items_subtotal_nonnegative'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_items_subtotal_nonnegative
      check (items_subtotal >= 0) not valid;
  end if;
end $$;

alter table public.orders validate constraint orders_delivery_fee_nonnegative;
alter table public.orders validate constraint orders_items_subtotal_nonnegative;

create index if not exists orders_unaccepted_created_at_idx
  on public.orders (created_at desc)
  where accepted_at is null;

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
  new_order_id bigint;
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

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items must be a non-empty array';
  end if;

  if p_items_subtotal < 0 or p_delivery_fee < 0
     or p_total <> p_items_subtotal + p_delivery_fee then
    raise exception 'invalid totals';
  end if;

  if p_order_type = 'delivery' then
    if nullif(btrim(p_phone), '') is null
       or nullif(btrim(p_address), '') is null
       or nullif(btrim(p_delivery_zone), '') is null then
      raise exception 'delivery details are required';
    end if;
  else
    if nullif(btrim(p_table_number), '') is null then
      raise exception 'table_number is required';
    end if;
    p_delivery_zone := null;
    p_delivery_fee := 0;
    p_total := p_items_subtotal;
  end if;

  insert into public.orders (
    customer_name, phone, order_type, table_number, address,
    items, items_subtotal, delivery_zone, delivery_fee, total,
    payment_method, payment_status, order_status, accepted_at
  ) values (
    p_customer_name, p_phone, p_order_type, p_table_number, p_address,
    p_items, p_items_subtotal, p_delivery_zone, p_delivery_fee, p_total,
    p_payment_method, 'waiting', 'waiting_payment', null
  )
  returning id into new_order_id;

  return new_order_id;
end;
$$;

revoke all on function public.create_order_v2(
  text, text, text, text, text, jsonb,
  integer, text, integer, integer, text
) from public;

grant execute on function public.create_order_v2(
  text, text, text, text, text, jsonb,
  integer, text, integer, integer, text
) to anon, authenticated;

commit;
