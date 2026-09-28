-- BAI FOOD — menu update: delivery/Kaspi UI + new burgers, hot dishes and salads

-- SAFE SQL PATCH. Run manually in Supabase SQL Editor after reviewing.

-- Does not delete or rewrite old orders. Existing products remain.



begin;



insert into public.product_availability (product_id, display_name, is_stopped) values

  ('cheeseburger-chicken','Чизбургер куриный',false),

  ('cheeseburger-beef','Чизбургер говяжий',false),

  ('chicken-mushroom-cream','Курица с грибами в сливочном соусе',false),

  ('hoshan','Хошан',false),

  ('manty','Манты',false),

  ('fries-meat','Фри с мясом',false),

  ('thai-meat','Мясо по-тайски',false),

  ('tai-kuirdak','Тай қуырдақ',false),

  ('plov','Плов',false),

  ('salad-crispy-eggplant','Хрустящий баклажан',false),

  ('salad-caesar-chicken','Цезарь с курицей',false),

  ('salad-gnezdo','Гнездо глухаря',false),

  ('salad-greek','Греческий',false)

on conflict (product_id) do update set display_name=excluded.display_name;



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

    when 'cheeseburger-chicken' then v_name := 'Чизбургер куриный';

    when 'cheeseburger-beef' then v_name := 'Чизбургер говяжий';



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

    when 'chicken-mushroom-cream' then v_name := 'Курица с грибами в сливочном соусе'; v_price := 2600;

    when 'hoshan' then v_name := 'Хошан'; v_price := 2200;

    when 'manty' then v_name := 'Манты'; v_price := 2000;

    when 'fries-meat' then v_name := 'Фри с мясом'; v_price := 2200;

    when 'thai-meat' then v_name := 'Мясо по-тайски'; v_price := 2200;

    when 'tai-kuirdak' then v_name := 'Тай қуырдақ'; v_price := 3100;

    when 'plov' then v_name := 'Плов'; v_price := 2500;

    when 'salad-crispy-eggplant' then v_name := 'Хрустящий баклажан'; v_price := 2200;

    when 'salad-caesar-chicken' then v_name := 'Цезарь с курицей'; v_price := 2500;

    when 'salad-gnezdo' then v_name := 'Гнездо глухаря'; v_price := 2300;

    when 'salad-greek' then v_name := 'Греческий'; v_price := 2100;

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

  elsif v_product_id = 'cheeseburger-chicken' then

    case v_variant_id

      when '1-patty' then v_variant_name := '1 котлета'; v_price := 1390;

      when '2-patties' then v_variant_name := '2 котлеты'; v_price := 1690;

      else raise exception 'invalid burger variant';

    end case;

  elsif v_product_id = 'cheeseburger-beef' then

    case v_variant_id

      when '1-patty' then v_variant_name := '1 котлета'; v_price := 1650;

      when '2-patties' then v_variant_name := '2 котлеты'; v_price := 2050;

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

      when '500g' then v_variant_name := '500 г'; v_price := 3300;

      when '700-g' then v_variant_name := '700 г'; v_price := 4100;

      when '700g' then v_variant_name := '700 г'; v_price := 4100;

      when '1000-g' then v_variant_name := '1 кг'; v_price := 6100;

      when '1kg' then v_variant_name := '1 кг'; v_price := 6100;

      when '1500-g' then v_variant_name := '1.5 кг'; v_price := 8800;

      when '1.5kg' then v_variant_name := '1.5 кг'; v_price := 8800;

      else raise exception 'invalid fish variant';

    end case;

  elsif v_product_id = 'fish-assorti' then

    case v_variant_id

      when '1000-g' then v_variant_name := '1 кг'; v_price := 6100;

      when '1kg' then v_variant_name := '1 кг'; v_price := 6100;

      when '1500-g' then v_variant_name := '1.5 кг'; v_price := 8800;

      when '1.5kg' then v_variant_name := '1.5 кг'; v_price := 8800;

      else raise exception 'invalid fish assorti variant';

    end case;

  end if;



  -- Любой произвольный variant_id у товара без вариантов запрещён.

  if v_product_id <> all(array[

    'wings','nuggets','strips','chef-burger','chef-burger-hot',

    'cheeseburger-onion','cheeseburger-onion-hot','cheeseburger-chicken','cheeseburger-beef',

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





revoke all on function public.bai_food_normalize_item(jsonb) from public;

grant execute on function public.bai_food_normalize_item(jsonb) to anon, authenticated;



commit;
