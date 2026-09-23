-- BAI FOOD: серверная нормализация расширенного меню с суши.
-- Запустить ПОСЛЕ supabase_patch_menu_prep_change.sql.
-- Старые заказы, таблицы, RLS и авторизация не изменяются.

create or replace function public.bai_food_normalize_item(p_item jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id text := nullif(btrim(p_item ->> 'product_id'), '');
  v_variant_id text := nullif(btrim(p_item ->> 'variant_id'), '');
  v_quantity integer;
  v_name text;
  v_variant_name text;
  v_base_price integer;
  v_addon_price integer := 0;
  v_is_promo boolean := false;
  v_client_addons jsonb := coalesce(p_item -> 'addon_ids', '[]'::jsonb);
  v_addon_id text;
  v_addon_name text;
  v_addon_ids text[] := array[]::text[];
  v_addon_names text[] := array[]::text[];
begin
  if v_product_id is null then
    raise exception 'product_id is required';
  end if;

  if coalesce(p_item ->> 'quantity', '') !~ '^[1-9][0-9]*$' then
    raise exception 'invalid quantity';
  end if;
  v_quantity := (p_item ->> 'quantity')::integer;
  if v_quantity > 100 then
    raise exception 'quantity is too large';
  end if;

  select x.name, x.price, x.is_promo
    into v_name, v_base_price, v_is_promo
  from (values
    ('set-1','SET 1',5750,true),
    ('set-3','SET 3',10900,true),
    ('set-4','SET 4',15900,true),
    ('sushi-set-1','Суши SET №1',5990,true),
    ('sushi-set-2','Суши SET №2',6990,true),
    ('sushi-set-3','Суши SET №3',8490,true),
    ('sushi-set-5','Суши SET №5',8490,true),
    ('sushi-set-6','Суши SET №6',5490,true),
    ('sushi-set-7','Суши SET №7',11990,true),
    ('sushi-set-8','Суши SET №8',10990,true),
    ('sushi-set-9','Суши SET №9',17990,true),
    ('doner-chicken','Донер куриный',1400,false),
    ('doner-beef','Донер говяжий',1800,false),
    ('doner-assorti','Донер ассорти',1700,false),
    ('doner-chicken-15','Куриный 1.5',1800,false),
    ('doner-beef-15','Говяжий 1.5',2200,false),
    ('doner-assorti-15','Ассорти 1.5',2000,false),
    ('pizza-pepperoni','Пепперони',2500,false),
    ('pizza-pepperoni-hot','Пепперони острый',2700,false),
    ('pizza-hunter','Пицца с охотничьими колбасами',2500,false),
    ('pizza-margarita','Маргарита',2500,false),
    ('pizza-mushroom','Грибная',2500,false),
    ('pizza-mushroom-sausage','Грибы и колбаса',2500,false),
    ('pizza-chicken-mushroom','Курица с грибами',2500,false),
    ('pizza-chicken','Куриная',2500,false),
    ('pizza-cheese-chicken','Сырный цыпленок',2800,false),
    ('pizza-cheese','Сырная',2500,false),
    ('pizza-mince','Пицца с фаршем',3000,false),
    ('pizza-four-seasons','4 сезона',3500,false),
    ('pizza-mexican','Мексиканская',3000,false),
    ('pizza-assorti','Ассорти',3500,false),
    ('fries-medium','Фри средний',700,false),
    ('potato-balls-120','Картофельные шарики 120 г',600,false),
    ('potato-balls-200','Картофельные шарики 200 г',900,false),
    ('onion-rings','Луковые кольца',900,false),
    ('potato-wedges','Картофельные дольки',900,false),
    ('sauce-ketchup','Кетчуп',250,false),
    ('sauce-garlic','Чесночный',250,false),
    ('sauce-honey-mustard','Медово-горчичный',250,false),
    ('sauce-cheese','Сырный',250,false),
    ('sauce-bbq','Барбекю',250,false),
    ('sauce-sweet-sour','Кисло-сладкий',250,false),
    ('ayran','Айран',250,false),
    ('cola-05','Coca-Cola 0.5 л',550,false),
    ('cola-can','Coca-Cola банка',550,false),
    ('sprite-can','Sprite банка',550,false),
    ('fanta-can','Fanta банка',550,false),
    ('fuse','Fuse Tea',550,false),
    ('maxi','Maxi Tea',550,false),
    ('mojito','Mojito',550,false),
    ('cola-1','Coca-Cola 1 л',780,false),
    ('fuse-1','Fuse Tea 1 л',780,false),
    ('maxi-1','Maxi Tea 1 л',780,false),
    ('cola-15','Coca-Cola 1.5 л',1000,false),
    ('fuse-15','Fuse Tea 1.5 л',1000,false),
    ('cola-2','Coca-Cola 2 л',1300,false),
    ('sushi-philadelphia','Филадельфия',2790,false),
    ('sushi-philadelphia-cucumber','Филадельфия с огурцом',2690,false),
    ('sushi-philadelphia-grill','Филадельфия гриль',2890,false),
    ('sushi-alaska','Аляска',2390,false),
    ('sushi-california','Калифорния',2490,false),
    ('sushi-bonito','Бонито',2190,false),
    ('sushi-america','Америка',2890,false),
    ('sushi-caesar','Цезарь',2290,false),
    ('sushi-salmon-tempura','Лосось темпура',2990,false),
    ('sushi-caesar-hat','Цезарь с шапочкой',2790,false),
    ('sushi-sake-tempura','Саке темпура',2890,false),
    ('sushi-america-chicken','Америка с курицей',2490,false),
    ('sushi-sandwich','Суши-сэндвич с лососем',2800,false),
    ('sushi-baked-caesar','Запечённый цезарь',2590,false),
    ('sushi-salmon-maki','Ролл с лососем',1400,false),
    ('sushi-spice-roll','Спайс ролл',1200,false),
    ('sushi-tomato-maki','Томато маки',700,false),
    ('sushi-tobiko-maki','Ролл Тобико',700,false),
    ('sushi-cucumber-maki','Ролл с огурцом',900,false)
  ) as x(id,name,price,is_promo)
  where x.id = v_product_id;

  if not found then
    v_is_promo := false;
    if v_product_id = 'wings' then
      v_name := 'Крылышки';
      select x.name,x.price into v_variant_name,v_base_price from (values
        ('8-pcs','8 шт',2790),('12-pcs','12 шт',3790),('16-pcs','16 шт',4790),('20-pcs','20 шт',5990)
      ) x(id,name,price) where x.id=v_variant_id;
    elsif v_product_id = 'nuggets' then
      v_name := 'Наггетсы';
      select x.name,x.price into v_variant_name,v_base_price from (values
        ('5-pcs','5 шт',690),('8-pcs','8 шт',900),('12-pcs','12 шт',1500)
      ) x(id,name,price) where x.id=v_variant_id;
    elsif v_product_id = 'strips' then
      v_name := 'Стрипсы';
      select x.name,x.price into v_variant_name,v_base_price from (values
        ('6-pcs','6 шт',1790),('8-pcs','8 шт',2590),('12-pcs','12 шт',3350),('18-pcs','18 шт',4590)
      ) x(id,name,price) where x.id=v_variant_id;
    elsif v_product_id in ('chef-burger','chef-burger-hot','cheeseburger-onion','cheeseburger-onion-hot') then
      v_name := case v_product_id
        when 'chef-burger' then 'Шеф бургер'
        when 'chef-burger-hot' then 'Шеф бургер острый'
        when 'cheeseburger-onion' then 'Чизбургер с луком'
        else 'Чизбургер с луком острый' end;
      select x.name,
        case when v_product_id in ('chef-burger','chef-burger-hot') then x.chef_price else x.cheese_price end
      into v_variant_name,v_base_price
      from (values ('1-patty','1 котлета',1440,1500),('2-patties','2 котлеты',2100,2200)) x(id,name,chef_price,cheese_price)
      where x.id=v_variant_id;
    elsif v_product_id = 'sushi-baked' then
      v_name := 'Запечённые роллы';
      select x.name,x.price into v_variant_name,v_base_price from (values
        ('chicken','С курицей',2890),('salmon','С лососем',2890)
      ) x(id,name,price) where x.id=v_variant_id;
    elsif v_product_id = 'sushi-burger' then
      v_name := 'Суши-бургер';
      select x.name,x.price into v_variant_name,v_base_price from (values
        ('chicken','С курицей',2500),('salmon','С лососем',2800)
      ) x(id,name,price) where x.id=v_variant_id;
    else
      raise exception 'unknown product: %', v_product_id;
    end if;

    if v_base_price is null then
      raise exception 'invalid variant for product: %', v_product_id;
    end if;
  elsif v_variant_id is not null then
    raise exception 'variant is not allowed for product: %', v_product_id;
  end if;

  if jsonb_typeof(v_client_addons) <> 'array' then
    raise exception 'addon_ids must be an array';
  end if;

  for v_addon_id in select jsonb_array_elements_text(v_client_addons)
  loop
    if not (v_product_id = any(array[
      'doner-chicken','doner-beef','doner-assorti',
      'doner-chicken-15','doner-beef-15','doner-assorti-15'
    ]::text[])) then
      raise exception 'addons are not allowed for product: %', v_product_id;
    end if;
    if v_addon_id = any(v_addon_ids) then
      raise exception 'duplicate addon: %', v_addon_id;
    end if;
    case v_addon_id
      when 'cheese' then v_addon_name := 'Сыр'; v_addon_price := v_addon_price + 500;
      when 'mushrooms' then v_addon_name := 'Грибы'; v_addon_price := v_addon_price + 500;
      when 'double' then v_addon_name := 'Двойной'; v_addon_price := v_addon_price + 500;
      when 'pepper' then v_addon_name := 'Доп. перчик'; v_addon_price := v_addon_price + 100;
      else raise exception 'invalid addon: %', v_addon_id;
    end case;
    v_addon_ids := array_append(v_addon_ids,v_addon_id);
    v_addon_names := array_append(v_addon_names,v_addon_name);
  end loop;

  return jsonb_build_object(
    'product_id',v_product_id,
    'name',concat_ws(' — ',v_name,v_variant_name,nullif(array_to_string(v_addon_names,', '),'')),
    'quantity',v_quantity,
    'price',v_base_price + v_addon_price,
    'variant_id',v_variant_id,
    'variant',v_variant_name,
    'addon_ids',to_jsonb(v_addon_ids),
    'addons',to_jsonb(v_addon_names),
    'is_promo',v_is_promo
  );
end;
$$;

revoke all on function public.bai_food_normalize_item(jsonb) from public, anon, authenticated;

