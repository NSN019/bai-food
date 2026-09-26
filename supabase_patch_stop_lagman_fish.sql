-- ============================================================================
-- BAI FOOD — безопасный patch: STOP-list, ЛАҒМАН, РЫБА, 60/90 минут
-- Выполнять ТОЛЬКО поверх уже установленного supabase_patch_menu_prep_change.sql.
-- Старые заказы и их JSON items не изменяются. RLS orders не ослабляется.
-- ============================================================================

begin;

-- Расширяем только допустимые значения существующего поля времени.
alter table public.orders
  drop constraint if exists orders_prep_minutes_allowed;

alter table public.orders
  add constraint orders_prep_minutes_allowed
  check (prep_minutes is null or prep_minutes in (20, 30, 40, 60, 90))
  not valid;

alter table public.orders
  validate constraint orders_prep_minutes_allowed;


-- Единое серверное состояние STOP. Строки не удаляются кассирами.
create table if not exists public.product_availability (
  product_id text primary key,
  display_name text not null,
  is_stopped boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid null
);

alter table public.product_availability enable row level security;

-- Полный актуальный каталог. ON CONFLICT не меняет уже установленный STOP.
insert into public.product_availability (product_id, display_name)
values
  ('set-1','SET 1'),('set-3','SET 3'),('set-4','SET 4'),
  ('sushi-set-1','Суши SET №1'),('sushi-set-2','Суши SET №2'),
  ('sushi-set-3','Суши SET №3'),('sushi-set-5','Суши SET №5'),
  ('sushi-set-6','Суши SET №6'),('sushi-set-7','Суши SET №7'),
  ('sushi-set-8','Суши SET №8'),('sushi-set-9','Суши SET №9'),
  ('sushi-philadelphia','Филадельфия'),('sushi-philadelphia-cucumber','Филадельфия с огурцом'),
  ('sushi-philadelphia-grill','Филадельфия гриль'),('sushi-alaska','Аляска'),
  ('sushi-california','Калифорния'),('sushi-bonito','Бонито'),
  ('sushi-america','Америка'),('sushi-caesar','Цезарь'),
  ('sushi-salmon-tempura','Лосось темпура'),('sushi-caesar-hat','Цезарь с шапочкой'),
  ('sushi-sake-tempura','Саке темпура'),('sushi-america-chicken','Америка с курицей'),
  ('sushi-baked','Запечённые роллы'),('sushi-burger','Суши-бургер'),
  ('sushi-sandwich','Суши-сэндвич с лососем'),('sushi-baked-caesar','Запечённый цезарь'),
  ('sushi-salmon-maki','Ролл с лососем'),('sushi-spice-roll','Спайс ролл'),
  ('sushi-tomato-maki','Томато маки'),('sushi-tobiko-maki','Ролл Тобико'),
  ('sushi-cucumber-maki','Ролл с огурцом'),
  ('doner-chicken','Донер куриный'),('doner-beef','Донер говяжий'),
  ('doner-assorti','Донер ассорти'),('doner-chicken-15','Куриный 1.5'),
  ('doner-beef-15','Говяжий 1.5'),('doner-assorti-15','Ассорти 1.5'),
  ('pizza-pepperoni','Пепперони'),('pizza-pepperoni-hot','Пепперони острый'),
  ('pizza-hunter','Пицца с охотничьими колбасами'),('pizza-margarita','Маргарита'),
  ('pizza-mushroom','Грибная'),('pizza-mushroom-sausage','Грибы и колбаса'),
  ('pizza-chicken-mushroom','Курица с грибами'),('pizza-chicken','Куриная'),
  ('pizza-cheese-chicken','Сырный цыпленок'),('pizza-cheese','Сырная'),
  ('pizza-mince','Пицца с фаршем'),('pizza-four-seasons','4 сезона'),
  ('pizza-mexican','Мексиканская'),('pizza-assorti','Ассорти'),
  ('wings','Крылышки'),('nuggets','Наггетсы'),('strips','Стрипсы'),
  ('chef-burger','Шеф бургер'),('chef-burger-hot','Шеф бургер острый'),
  ('cheeseburger-onion','Чизбургер с луком'),
  ('cheeseburger-onion-hot','Чизбургер с луком острый'),
  ('fries-medium','Фри средний'),('potato-balls-200','Картофельные шарики — 200 г'),
  ('onion-rings','Луковые кольца'),('potato-wedges','Картофельные дольки'),
  ('sauce-ketchup','Кетчуп'),('sauce-garlic','Чесночный'),
  ('sauce-honey-mustard','Медово-горчичный'),('sauce-cheese','Сырный'),
  ('sauce-bbq','Барбекю'),('sauce-sweet-sour','Кисло-сладкий'),
  ('ayran','Айран'),('cola-05','Coca-Cola 0.5 л'),('cola-can','Coca-Cola банка'),
  ('sprite-can','Sprite банка'),('fanta-can','Fanta банка'),('fuse','Fuse Tea'),
  ('maxi','Maxi Tea'),('mojito','Mojito'),('cola-1','Coca-Cola 1 л'),
  ('fuse-1','Fuse Tea 1 л'),('maxi-1','Maxi Tea 1 л'),
  ('cola-15','Coca-Cola 1.5 л'),('fuse-15','Fuse Tea 1.5 л'),
  ('cola-2','Coca-Cola 2 л'),
  ('lagman-guyru','Гуйру лағман'),('lagman-suyru','Суйру лағман'),
  ('lagman-guyru-tsomyan','Гуйру цомян'),('lagman-suyru-tsomyan','Суйру цомян'),
  ('lagman-moguru','Могуру'),('lagman-moshuru','Мошуру'),('lagman-hauhau','Хаухау'),
  ('fish-sudak','Судак'),('fish-sazan','Сазан'),('fish-assorti','Ассорти (рыба)')
on conflict (product_id) do update
set display_name = excluded.display_name;


-- SECURITY DEFINER нужен только для безопасной проверки membership в staff.
create or replace function public.is_bai_food_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.staff s
    where coalesce(to_jsonb(s) ->> 'user_id', to_jsonb(s) ->> 'id') = auth.uid()::text
  );
$$;

revoke all on function public.is_bai_food_staff() from public, anon;
grant execute on function public.is_bai_food_staff() to authenticated;

drop policy if exists product_availability_public_read on public.product_availability;
create policy product_availability_public_read
on public.product_availability
for select
to anon, authenticated
using (true);

drop policy if exists product_availability_staff_update on public.product_availability;
create policy product_availability_staff_update
on public.product_availability
for update
to authenticated
using (public.is_bai_food_staff())
with check (public.is_bai_food_staff());

revoke all on table public.product_availability from public, anon, authenticated;
grant select on table public.product_availability to anon, authenticated;
grant update (is_stopped) on table public.product_availability to authenticated;


-- Касса использует RPC: product_id должен уже существовать в каталоге.
create or replace function public.set_product_stop_v1(
  p_product_id text,
  p_is_stopped boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_bai_food_staff() then
    raise exception 'staff authorization required' using errcode = '42501';
  end if;

  if nullif(btrim(p_product_id), '') is null or p_is_stopped is null then
    raise exception 'invalid stop-list request';
  end if;

  update public.product_availability
  set is_stopped = p_is_stopped,
      updated_at = clock_timestamp(),
      updated_by = auth.uid()
  where product_id = btrim(p_product_id);

  if not found then
    raise exception 'unknown product';
  end if;

  return true;
end;
$$;

revoke all on function public.set_product_stop_v1(text,boolean) from public, anon;
grant execute on function public.set_product_stop_v1(text,boolean) to authenticated;


-- Полная серверная нормализация: client name/price/variant/addons не доверяются.
create or replace function public.bai_food_normalize_item(p_item jsonb)
returns jsonb
language plpgsql
immutable
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id text := nullif(btrim(p_item ->> 'product_id'), '');
  v_variant_id text := nullif(btrim(p_item ->> 'variant_id'), '');
  v_quantity integer;
  v_name text;
  v_variant_name text := null;
  v_price integer;
  v_is_promo boolean := false;
  v_allowed_addons text[] := array[]::text[];
  v_addon_ids jsonb := coalesce(p_item -> 'addon_ids', '[]'::jsonb);
  v_addon_id text;
  v_addon_name text;
  v_addon_price integer;
  v_seen_addons text[] := array[]::text[];
  v_clean_addon_ids jsonb := '[]'::jsonb;
  v_clean_addons jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_item) <> 'object' or v_product_id is null then
    raise exception 'invalid order item';
  end if;

  if coalesce(p_item ->> 'quantity', '') !~ '^[1-9][0-9]?$' then
    raise exception 'invalid quantity';
  end if;
  v_quantity := (p_item ->> 'quantity')::integer;

  if jsonb_typeof(v_addon_ids) <> 'array' or jsonb_array_length(v_addon_ids) > 4 then
    raise exception 'invalid addon_ids';
  end if;

  case v_product_id
    when 'set-1' then v_name := 'SET 1'; v_price := 5750; v_is_promo := true;
    when 'set-3' then v_name := 'SET 3'; v_price := 10900; v_is_promo := true;
    when 'set-4' then v_name := 'SET 4'; v_price := 15900; v_is_promo := true;

    when 'sushi-set-1' then v_name := 'Суши SET №1'; v_price := 5990; v_is_promo := true;
    when 'sushi-set-2' then v_name := 'Суши SET №2'; v_price := 6990; v_is_promo := true;
    when 'sushi-set-3' then v_name := 'Суши SET №3'; v_price := 8490; v_is_promo := true;
    when 'sushi-set-5' then v_name := 'Суши SET №5'; v_price := 8490; v_is_promo := true;
    when 'sushi-set-6' then v_name := 'Суши SET №6'; v_price := 5490; v_is_promo := true;
    when 'sushi-set-7' then v_name := 'Суши SET №7'; v_price := 11990; v_is_promo := true;
    when 'sushi-set-8' then v_name := 'Суши SET №8'; v_price := 10990; v_is_promo := true;
    when 'sushi-set-9' then v_name := 'Суши SET №9'; v_price := 17990; v_is_promo := true;

    when 'sushi-philadelphia' then v_name := 'Филадельфия'; v_price := 2790;
    when 'sushi-philadelphia-cucumber' then v_name := 'Филадельфия с огурцом'; v_price := 2690;
    when 'sushi-philadelphia-grill' then v_name := 'Филадельфия гриль'; v_price := 2890;
    when 'sushi-alaska' then v_name := 'Аляска'; v_price := 2390;
    when 'sushi-california' then v_name := 'Калифорния'; v_price := 2490;
    when 'sushi-bonito' then v_name := 'Бонито'; v_price := 2190;
    when 'sushi-america' then v_name := 'Америка'; v_price := 2890;
    when 'sushi-caesar' then v_name := 'Цезарь'; v_price := 2290;
    when 'sushi-salmon-tempura' then v_name := 'Лосось темпура'; v_price := 2990;
    when 'sushi-caesar-hat' then v_name := 'Цезарь с шапочкой'; v_price := 2790;
    when 'sushi-sake-tempura' then v_name := 'Саке темпура'; v_price := 2890;
    when 'sushi-america-chicken' then v_name := 'Америка с курицей'; v_price := 2490;
    when 'sushi-baked' then v_name := 'Запечённые роллы';
    when 'sushi-burger' then v_name := 'Суши-бургер';
    when 'sushi-sandwich' then v_name := 'Суши-сэндвич с лососем'; v_price := 2800;
    when 'sushi-baked-caesar' then v_name := 'Запечённый цезарь'; v_price := 2590;
    when 'sushi-salmon-maki' then v_name := 'Ролл с лососем'; v_price := 1400;
    when 'sushi-spice-roll' then v_name := 'Спайс ролл'; v_price := 1200;
    when 'sushi-tomato-maki' then v_name := 'Томато маки'; v_price := 700;
    when 'sushi-tobiko-maki' then v_name := 'Ролл Тобико'; v_price := 700;
    when 'sushi-cucumber-maki' then v_name := 'Ролл с огурцом'; v_price := 900;

    when 'doner-chicken' then v_name := 'Донер куриный'; v_price := 1400; v_allowed_addons := array['cheese','mushrooms','double','pepper'];
    when 'doner-beef' then v_name := 'Донер говяжий'; v_price := 1800; v_allowed_addons := array['cheese','mushrooms','double','pepper'];
    when 'doner-assorti' then v_name := 'Донер ассорти'; v_price := 1700; v_allowed_addons := array['cheese','mushrooms','double','pepper'];
    when 'doner-chicken-15' then v_name := 'Куриный 1.5'; v_price := 1800; v_allowed_addons := array['cheese','mushrooms','double','pepper'];
    when 'doner-beef-15' then v_name := 'Говяжий 1.5'; v_price := 2200; v_allowed_addons := array['cheese','mushrooms','double','pepper'];
    when 'doner-assorti-15' then v_name := 'Ассорти 1.5'; v_price := 2000; v_allowed_addons := array['cheese','mushrooms','double','pepper'];

    when 'pizza-pepperoni' then v_name := 'Пепперони'; v_price := 2500;
    when 'pizza-pepperoni-hot' then v_name := 'Пепперони острый'; v_price := 2700;
    when 'pizza-hunter' then v_name := 'Пицца с охотничьими колбасами'; v_price := 2500;
    when 'pizza-margarita' then v_name := 'Маргарита'; v_price := 2500;
    when 'pizza-mushroom' then v_name := 'Грибная'; v_price := 2500;
    when 'pizza-mushroom-sausage' then v_name := 'Грибы и колбаса'; v_price := 2500;
    when 'pizza-chicken-mushroom' then v_name := 'Курица с грибами'; v_price := 2500;
    when 'pizza-chicken' then v_name := 'Куриная'; v_price := 2500;
    when 'pizza-cheese-chicken' then v_name := 'Сырный цыпленок'; v_price := 2800;
    when 'pizza-cheese' then v_name := 'Сырная'; v_price := 2500;
    when 'pizza-mince' then v_name := 'Пицца с фаршем'; v_price := 3000;
    when 'pizza-four-seasons' then v_name := '4 сезона'; v_price := 3500;
    when 'pizza-mexican' then v_name := 'Мексиканская'; v_price := 3000;
    when 'pizza-assorti' then v_name := 'Ассорти'; v_price := 3500;

    when 'wings' then
      v_name := 'Крылышки';
      case v_variant_id
        when '8-pcs' then v_variant_name := '8 шт'; v_price := 2790;
        when '12-pcs' then v_variant_name := '12 шт'; v_price := 3790;
        when '16-pcs' then v_variant_name := '16 шт'; v_price := 4790;
        when '20-pcs' then v_variant_name := '20 шт'; v_price := 5990;
        else raise exception 'invalid wings variant';
      end case;
    when 'nuggets' then
      v_name := 'Наггетсы';
      case v_variant_id
        when '5-pcs' then v_variant_name := '5 шт'; v_price := 690;
        when '8-pcs' then v_variant_name := '8 шт'; v_price := 900;
        when '12-pcs' then v_variant_name := '12 шт'; v_price := 1500;
        else raise exception 'invalid nuggets variant';
      end case;
    when 'strips' then
      v_name := 'Стрипсы';
      case v_variant_id
        when '6-pcs' then v_variant_name := '6 шт'; v_price := 1790;
        when '8-pcs' then v_variant_name := '8 шт'; v_price := 2590;
        when '12-pcs' then v_variant_name := '12 шт'; v_price := 3350;
        when '18-pcs' then v_variant_name := '18 шт'; v_price := 4590;
        else raise exception 'invalid strips variant';
      end case;

    when 'chef-burger' then v_name := 'Шеф бургер';
    when 'chef-burger-hot' then v_name := 'Шеф бургер острый';
    when 'cheeseburger-onion' then v_name := 'Чизбургер с луком';
    when 'cheeseburger-onion-hot' then v_name := 'Чизбургер с луком острый';

    when 'fish-sudak' then v_name := 'Судак';
    when 'fish-sazan' then v_name := 'Сазан';
    when 'fish-assorti' then v_name := 'Ассорти';

    when 'fries-medium' then v_name := 'Фри средний'; v_price := 700;
    when 'potato-balls-200' then v_name := 'Картофельные шарики — 200 г'; v_price := 900;
    when 'onion-rings' then v_name := 'Луковые кольца'; v_price := 900;
    when 'potato-wedges' then v_name := 'Картофельные дольки'; v_price := 900;
    when 'sauce-ketchup' then v_name := 'Кетчуп'; v_price := 250;
    when 'sauce-garlic' then v_name := 'Чесночный'; v_price := 250;
    when 'sauce-honey-mustard' then v_name := 'Медово-горчичный'; v_price := 250;
    when 'sauce-cheese' then v_name := 'Сырный'; v_price := 250;
    when 'sauce-bbq' then v_name := 'Барбекю'; v_price := 250;
    when 'sauce-sweet-sour' then v_name := 'Кисло-сладкий'; v_price := 250;
    when 'ayran' then v_name := 'Айран'; v_price := 250;
    when 'cola-05' then v_name := 'Coca-Cola 0.5 л'; v_price := 550;
    when 'cola-can' then v_name := 'Coca-Cola банка'; v_price := 550;
    when 'sprite-can' then v_name := 'Sprite банка'; v_price := 550;
    when 'fanta-can' then v_name := 'Fanta банка'; v_price := 550;
    when 'fuse' then v_name := 'Fuse Tea'; v_price := 550;
    when 'maxi' then v_name := 'Maxi Tea'; v_price := 550;
    when 'mojito' then v_name := 'Mojito'; v_price := 550;
    when 'cola-1' then v_name := 'Coca-Cola 1 л'; v_price := 780;
    when 'fuse-1' then v_name := 'Fuse Tea 1 л'; v_price := 780;
    when 'maxi-1' then v_name := 'Maxi Tea 1 л'; v_price := 780;
    when 'cola-15' then v_name := 'Coca-Cola 1.5 л'; v_price := 1000;
    when 'fuse-15' then v_name := 'Fuse Tea 1.5 л'; v_price := 1000;
    when 'cola-2' then v_name := 'Coca-Cola 2 л'; v_price := 1300;

    when 'lagman-guyru' then v_name := 'Гуйру лағман'; v_price := 1600;
    when 'lagman-suyru' then v_name := 'Суйру лағман'; v_price := 1600;
    when 'lagman-guyru-tsomyan' then v_name := 'Гуйру цомян'; v_price := 1800;
    when 'lagman-suyru-tsomyan' then v_name := 'Суйру цомян'; v_price := 1800;
    when 'lagman-moguru' then v_name := 'Могуру'; v_price := 1900;
    when 'lagman-moshuru' then v_name := 'Мошуру'; v_price := 2000;
    when 'lagman-hauhau' then v_name := 'Хаухау'; v_price := 2000;
    else raise exception 'unknown or unavailable product: %', v_product_id;
  end case;

  -- Варианты бургеров.
  if v_product_id = any(array['chef-burger','chef-burger-hot']::text[]) then
    case v_variant_id
      when '1-patty' then v_variant_name := '1 котлета'; v_price := 1440;
      when '2-patties' then v_variant_name := '2 котлеты'; v_price := 2100;
      else raise exception 'invalid burger variant';
    end case;
  elsif v_product_id = any(array['cheeseburger-onion','cheeseburger-onion-hot']::text[]) then
    case v_variant_id
      when '1-patty' then v_variant_name := '1 котлета'; v_price := 1500;
      when '2-patties' then v_variant_name := '2 котлеты'; v_price := 2200;
      else raise exception 'invalid burger variant';
    end case;
  end if;


  -- Варианты суши с выбором начинки.
  if v_product_id = 'sushi-baked' then
    case v_variant_id
      when 'chicken' then v_variant_name := 'С курицей'; v_price := 2890;
      when 'salmon' then v_variant_name := 'С лососем'; v_price := 2890;
      else raise exception 'invalid sushi baked variant';
    end case;
  elsif v_product_id = 'sushi-burger' then
    case v_variant_id
      when 'chicken' then v_variant_name := 'С курицей'; v_price := 2500;
      when 'salmon' then v_variant_name := 'С лососем'; v_price := 2800;
      else raise exception 'invalid sushi burger variant';
    end case;
  end if;

  -- Варианты рыбы строго ограничены разрешёнными весами.
  if v_product_id = any(array['fish-sudak','fish-sazan']::text[]) then
    case v_variant_id
      when '500-g' then v_variant_name := '500 г'; v_price := 3300;
      when '700-g' then v_variant_name := '700 г'; v_price := 4100;
      when '1000-g' then v_variant_name := '1 кг'; v_price := 6100;
      when '1500-g' then v_variant_name := '1.5 кг'; v_price := 8800;
      else raise exception 'invalid fish variant';
    end case;
  elsif v_product_id = 'fish-assorti' then
    case v_variant_id
      when '1000-g' then v_variant_name := '1 кг'; v_price := 6100;
      when '1500-g' then v_variant_name := '1.5 кг'; v_price := 8800;
      else raise exception 'invalid fish assorti variant';
    end case;
  end if;

  -- Любой произвольный variant_id у товара без вариантов запрещён.
  if v_product_id <> all(array[
    'wings','nuggets','strips','chef-burger','chef-burger-hot',
    'cheeseburger-onion','cheeseburger-onion-hot',
    'fish-sudak','fish-sazan','fish-assorti'
  ]::text[]) and v_variant_id is not null then
    raise exception 'variant is not allowed for product';
  end if;

  -- Добавки разрешены только донерам, без повторов и с серверной ценой.
  for v_addon_id in select value from jsonb_array_elements_text(v_addon_ids)
  loop
    if not (v_addon_id = any(v_allowed_addons)) then
      raise exception 'addon is not allowed for product';
    end if;
    if v_addon_id = any(v_seen_addons) then
      raise exception 'duplicate addon';
    end if;
    v_seen_addons := array_append(v_seen_addons, v_addon_id);

    case v_addon_id
      when 'cheese' then v_addon_name := 'Сыр'; v_addon_price := 500;
      when 'mushrooms' then v_addon_name := 'Грибы'; v_addon_price := 500;
      when 'double' then v_addon_name := 'Двойной'; v_addon_price := 500;
      when 'pepper' then v_addon_name := 'Доп. перчик'; v_addon_price := 100;
      else raise exception 'invalid addon';
    end case;

    v_price := v_price + v_addon_price;
    v_clean_addon_ids := v_clean_addon_ids || jsonb_build_array(v_addon_id);
    v_clean_addons := v_clean_addons || jsonb_build_array(jsonb_build_object(
      'id', v_addon_id, 'name', v_addon_name, 'price', v_addon_price
    ));
  end loop;

  if v_variant_name is not null then
    v_name := v_name || ' — ' || v_variant_name;
  end if;
  for v_addon_name in select value ->> 'name' from jsonb_array_elements(v_clean_addons)
  loop
    v_name := v_name || ' — ' || v_addon_name;
  end loop;

  return jsonb_build_object(
    'product_id', v_product_id,
    'name', v_name,
    'quantity', v_quantity,
    'price', v_price,
    'variant_id', v_variant_id,
    'variant', v_variant_name,
    'addon_ids', v_clean_addon_ids,
    'addons', v_clean_addons,
    'is_promo', v_is_promo,
    'is_gift', false
  );
end;
$$;

revoke all on function public.bai_food_normalize_item(jsonb)
  from public, anon, authenticated;


-- Единая реализация заказа: server totals + server gifts + transactional STOP.
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
  end if;

  v_total_bigint := v_subtotal::bigint + v_delivery_fee::bigint;
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
    delivery_zone,delivery_fee,total,payment_method,payment_status,order_status,
    accepted_at,prep_minutes,cash_change_mode,cash_change_from
  ) values (
    btrim(p_customer_name),nullif(btrim(p_phone),''),p_order_type,
    nullif(btrim(p_table_number),''),nullif(btrim(p_address),''),v_clean_items,
    v_subtotal,case when p_order_type='delivery' then btrim(p_delivery_zone) else null end,
    v_delivery_fee,v_total,p_payment_method,'waiting','waiting_payment',null,null,
    p_cash_change_mode,p_cash_change_from
  ) returning id into v_new_order_id;
  return v_new_order_id;
end;
$$;


-- Обе установленные сигнатуры create_order_v2 сохраняются.
create or replace function public.create_order_v2(
  p_customer_name text,p_phone text,p_order_type text,p_table_number text,
  p_address text,p_items jsonb,p_items_subtotal integer,p_delivery_zone text,
  p_delivery_fee integer,p_total integer,p_payment_method text
)
returns bigint language sql security definer set search_path=public,pg_temp as $$
  select public.bai_food_create_order_core(
    p_customer_name,p_phone,p_order_type,p_table_number,p_address,p_items,
    p_items_subtotal,p_delivery_zone,p_delivery_fee,p_total,p_payment_method,null,null
  );
$$;

create or replace function public.create_order_v2(
  p_customer_name text,p_phone text,p_order_type text,p_table_number text,
  p_address text,p_items jsonb,p_items_subtotal integer,p_delivery_zone text,
  p_delivery_fee integer,p_total integer,p_payment_method text,
  p_cash_change_mode text,p_cash_change_from integer
)
returns bigint language sql security definer set search_path=public,pg_temp as $$
  select public.bai_food_create_order_core(
    p_customer_name,p_phone,p_order_type,p_table_number,p_address,p_items,
    p_items_subtotal,p_delivery_zone,p_delivery_fee,p_total,p_payment_method,
    p_cash_change_mode,p_cash_change_from
  );
$$;

revoke all on function public.bai_food_create_order_core(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) from public,anon,authenticated;

revoke all on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text
) from public;
grant execute on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text
) to anon,authenticated;

revoke all on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) from public;
grant execute on function public.create_order_v2(
  text,text,text,text,text,jsonb,integer,text,integer,integer,text,text,integer
) to anon,authenticated;

commit;
