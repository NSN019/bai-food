// BAI FOOD — клиент, корзина и совместимая интеграция Supabase
const SUPABASE_URL = "https://elzjmbwkgleuzpybiqdg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImVsemptYndrZ2xldXpweWJpcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDA1OTEsImV4cCI6MjEwNDA3NjU5MX0.JtcrSCdtV20YrMIyqYI66SjywOgGa4CVRqFRdpCujLg";
const KASPI_PAY_URL = "https://pay.kaspi.kz/pay/erdj2tbh";
const GIFT_THRESHOLD = 10000;

const ADDONS = {
  cheese: { id: "cheese", name: "Сыр", price: 500 },
  mushrooms: { id: "mushrooms", name: "Грибы", price: 500 },
  double: { id: "double", name: "Двойной", price: 500 },
  pepper: { id: "pepper", name: "Доп. перчик", price: 100 },
  spicyPizza: { id: "spicy-pizza", name: "Острый перчик", price: 200 }
};

const sets = [
  { id:"set-1", name:"SET 1", price:5750, icon:"🍕", image:"assets/menu/fast-set-1.webp", isPromo:true, description:"2 пиццы Пепперони · 2 порции фри · Coca-Cola 1 л в подарок" },
  { id:"set-3", name:"SET 3", price:10900, icon:"🍗", image:"assets/menu/fast-set-3.webp", isPromo:true, description:"Куриная, Пепперони, 4 сезона · 12 крылышек · 3 фри · Coca-Cola 2 л в подарок" },
  { id:"set-4", name:"SET 4", price:15900, icon:"🔥", image:"assets/menu/fast-set-4.webp", isPromo:true, description:"Пепперони, 4 сезона · 26 крылышек · 12 стрипсов · Coca-Cola 2 л в подарок" }
];

const sushiSets = [
  {id:"sushi-set-1",name:"Суши SET №1",price:5990,icon:"🍱",image:"assets/sushi/sushi-set-1.webp",isPromo:true,description:"Ролл с огурцом 10 шт · Цезарь 10 шт · Пепперони · Coca-Cola 1 л в подарок"},
  {id:"sushi-set-2",name:"Суши SET №2",price:6990,icon:"🍱",image:"assets/sushi/sushi-set-2.webp",isPromo:true,description:"Саке темпура 10 шт · Филадельфия 10 шт · Америка 10 шт · Ролл Тобико · Coca-Cola 1 л в подарок"},
  {id:"sushi-set-3",name:"Суши SET №3",price:8490,icon:"🍱",image:"assets/sushi/sushi-set-3.webp",isPromo:true,description:"Цезарь с шапочкой 10 шт · Филадельфия 10 шт · Саке темпура 10 шт · Америка 10 шт · Coca-Cola 1 л в подарок"},
  {id:"sushi-set-5",name:"Суши SET №5",price:8490,icon:"🍱",image:"assets/sushi/sushi-set-5.webp",isPromo:true,description:"Цезарь с шапочкой 10 шт · Цезарь 10 шт · Аляска 10 шт · Пепперони · Coca-Cola 1 л в подарок"},
  {id:"sushi-set-6",name:"Суши SET №6",price:5490,icon:"🍱",image:"assets/sushi/sushi-set-6.webp",isPromo:true,description:"Роллы с огурцом, тобико, лососем и курицей по 10 шт · Пепперони · Фри"},
  {id:"sushi-set-7",name:"Суши SET №7",price:11990,icon:"🍱",image:"assets/sushi/sushi-set-7.webp",isPromo:true,description:"Филадельфия, Цезарь, Цезарь с шапочкой и Америка по 10 шт · Сырная · Пепперони · Фри"},
  {id:"sushi-set-8",name:"Суши SET №8",price:10990,icon:"🍱",image:"assets/sushi/sushi-set-8.webp",isPromo:true,description:"Америка, Цезарь с шапочкой и Ролл Тобико по 10 шт · Крылышки 8 шт · Фри ×2"},
  {id:"sushi-set-9",name:"Суши SET №9",price:17990,icon:"🍱",image:"assets/sushi/sushi-set-9.webp",isPromo:true,description:"4 вида роллов по 10 шт · Крылышки 12 шт · Наггетсы 8 шт · Фри ×3 · Coca-Cola 2 л"}
];

const categories = [
  { id:"doner", name:"Фастфуд", icon:"🌯", items:[
    { id:"doner-chicken", name:"Донер куриный", price:1400, image:"assets/menu/doner.webp", description:"Куриная грудка", addons:["cheese","mushrooms","double","pepper"] },
    { id:"doner-beef", name:"Донер говяжий", price:1800, image:"assets/menu/doner.webp", description:"Говядина", addons:["cheese","mushrooms","double","pepper"] },
    { id:"doner-assorti", name:"Донер ассорти", price:1700, image:"assets/menu/doner.webp", description:"Курица и говядина", addons:["cheese","mushrooms","double","pepper"] },
    { id:"doner-chicken-15", name:"Куриный 1.5", price:1800, image:"assets/menu/doner.webp", addons:["cheese","mushrooms","double","pepper"] },
    { id:"doner-beef-15", name:"Говяжий 1.5", price:2200, image:"assets/menu/doner.webp", addons:["cheese","mushrooms","double","pepper"] },
    { id:"doner-assorti-15", name:"Ассорти 1.5", price:2000, image:"assets/menu/doner.webp", addons:["cheese","mushrooms","double","pepper"] }
  ]},
  { id:"pizza", name:"Пицца", icon:"🍕", items:[
    {id:"pizza-pepperoni",name:"Пепперони",price:2500,image:"assets/menu/pizza-pepperoni.webp"},{id:"pizza-pepperoni-hot",name:"Пепперони острый",price:2700,image:"assets/menu/pizza-pepperoni-stock.webp"},
    {id:"pizza-hunter",name:"Пицца с охотничьими колбасами",price:2500,image:"assets/menu/pizza-mushroom-sausage.webp"},{id:"pizza-margarita",name:"Маргарита",price:2500,image:"assets/menu/pizza-margarita.webp"},
    {id:"pizza-mushroom",name:"Грибная",price:2500,image:"assets/menu/pizza-mushroom.webp"},{id:"pizza-mushroom-sausage",name:"Грибы и колбаса",price:2500,image:"assets/menu/pizza-mushroom-sausage.webp"},
    {id:"pizza-chicken-mushroom",name:"Курица с грибами",price:2500,image:"assets/menu/pizza-mushroom.webp"},{id:"pizza-chicken",name:"Куриная",price:2500,image:"assets/menu/pizza-meat.webp"},
    {id:"pizza-cheese-chicken",name:"Сырный цыпленок",price:2800,image:"assets/menu/pizza-meat.webp"},{id:"pizza-cheese",name:"Сырная",price:2500,image:"assets/menu/pizza-cheese.webp"},
    {id:"pizza-mince",name:"Пицца с фаршем",price:3000,image:"assets/menu/pizza-mince.webp"},
    {id:"pizza-four-seasons",name:"4 сезона",price:3500,image:"assets/menu/pizza-four-seasons.webp"},{id:"pizza-mexican",name:"Мексиканская",price:3000,image:"assets/menu/pizza-meat.webp"},
    {id:"pizza-assorti",name:"Ассорти",price:3500,image:"assets/menu/pizza-assorti.webp"}
  ]},
  { id:"chicken", name:"CHICKEN", icon:"🍗", items:[
    {id:"wings",name:"Крылышки",image:"assets/menu/wings.webp",options:[{id:"8-pcs",name:"8 шт",price:2790},{id:"12-pcs",name:"12 шт",price:3790},{id:"16-pcs",name:"16 шт",price:4790},{id:"20-pcs",name:"20 шт",price:5990}]},
    {id:"nuggets",name:"Наггетсы",image:"assets/menu/nuggets.webp",options:[{id:"5-pcs",name:"5 шт",price:690},{id:"8-pcs",name:"8 шт",price:900},{id:"12-pcs",name:"12 шт",price:1500}]},
    {id:"strips",name:"Стрипсы",image:"assets/menu/strips.webp",options:[{id:"6-pcs",name:"6 шт",price:1790},{id:"8-pcs",name:"8 шт",price:2590},{id:"12-pcs",name:"12 шт",price:3350},{id:"18-pcs",name:"18 шт",price:4590}]}
  ]},
  { id:"burgers", name:"Бургеры", icon:"🍔", items:[
    {id:"chef-burger",name:"Шеф бургер",image:"assets/menu/burger-single.webp",options:[{id:"1-patty",name:"1 котлета",price:1440},{id:"2-patties",name:"2 котлеты",price:2100}]},
    {id:"chef-burger-hot",name:"Шеф бургер острый",image:"assets/menu/burger-single.webp",options:[{id:"1-patty",name:"1 котлета",price:1440},{id:"2-patties",name:"2 котлеты",price:2100}]},
    {id:"cheeseburger-onion",name:"Чизбургер с луком",image:"assets/menu/burger-double.webp",options:[{id:"1-patty",name:"1 котлета",price:1500},{id:"2-patties",name:"2 котлеты",price:2200}]},
    {id:"cheeseburger-onion-hot",name:"Чизбургер с луком острый",image:"assets/menu/burger-double.webp",options:[{id:"1-patty",name:"1 котлета",price:1500},{id:"2-patties",name:"2 котлеты",price:2200}]}
  ]},
  { id:"sides", name:"Фри и снеки", icon:"🍟", items:[
    {id:"fries-medium",name:"Фри средний",price:700,image:"assets/menu/fries.webp"},
    {id:"potato-balls-200",name:"Картофельные шарики 200 г",price:900,image:"assets/menu/potato-balls.webp"},
    {id:"onion-rings",name:"Луковые кольца",price:900,image:"assets/menu/onion-rings.webp"},{id:"potato-wedges",name:"Картофельные дольки",price:900,image:"assets/menu/potato-wedges.webp"}
  ]},
  { id:"sauces", name:"Соусы", icon:"🥣", items:[
    {id:"sauce-ketchup",name:"Кетчуп",price:250,image:"assets/menu/sauce-ketchup.webp"},{id:"sauce-garlic",name:"Чесночный",price:250,image:"assets/menu/sauce-garlic.webp"},
    {id:"sauce-honey-mustard",name:"Медово-горчичный",price:250,image:"assets/menu/sauce-honey-mustard.webp"},{id:"sauce-cheese",name:"Сырный",price:250,image:"assets/menu/sauce-cheese.webp"},
    {id:"sauce-bbq",name:"Барбекю",price:250,image:"assets/menu/sauce-bbq.webp"},{id:"sauce-sweet-sour",name:"Кисло-сладкий",price:250,image:"assets/menu/sauce-sweet-sour.webp"}
  ]},
  { id:"sushi", name:"Суши", icon:"🍣", items:[
    {id:"sushi-philadelphia",name:"Филадельфия",price:2790,image:"assets/sushi/philadelphia.webp"},
    {id:"sushi-philadelphia-cucumber",name:"Филадельфия с огурцом",price:2690,image:"assets/sushi/philadelphia-cucumber.webp"},
    {id:"sushi-philadelphia-grill",name:"Филадельфия гриль",price:2890,image:"assets/sushi/philadelphia-grill.webp"},
    {id:"sushi-alaska",name:"Аляска",price:2390,image:"assets/sushi/alaska.webp"},
    {id:"sushi-california",name:"Калифорния",price:2490,image:"assets/sushi/california.webp"},
    {id:"sushi-bonito",name:"Бонито",price:2190,image:"assets/sushi/bonito.webp"},
    {id:"sushi-america",name:"Америка",price:2890,image:"assets/sushi/america.webp",description:"Жареный ролл"},
    {id:"sushi-caesar",name:"Цезарь",price:2290,image:"assets/sushi/caesar.webp",description:"Жареный ролл"},
    {id:"sushi-salmon-tempura",name:"Лосось темпура",price:2990,image:"assets/sushi/salmon-tempura.webp",description:"Жареный ролл"},
    {id:"sushi-caesar-hat",name:"Цезарь с шапочкой",price:2790,image:"assets/sushi/caesar-hat.webp",description:"Жареный ролл"},
    {id:"sushi-sake-tempura",name:"Саке темпура",price:2890,image:"assets/sushi/sake-tempura.webp",description:"Жареный ролл"},
    {id:"sushi-america-chicken",name:"Америка с курицей",price:2490,image:"assets/sushi/america-chicken.webp",description:"Жареный ролл"},
    {id:"sushi-baked",name:"Запечённые роллы",image:"assets/sushi/baked-rolls.webp",description:"С курицей или лососем",options:[{id:"chicken",name:"С курицей",price:2890},{id:"salmon",name:"С лососем",price:2890}]},
    {id:"sushi-burger",name:"Суши-бургер",image:"assets/sushi/sushi-burger.webp",options:[{id:"chicken",name:"С курицей",price:2500},{id:"salmon",name:"С лососем",price:2800}]},
    {id:"sushi-sandwich",name:"Суши-сэндвич с лососем",price:2800,image:"assets/sushi/sushi-sandwich.webp"},
    {id:"sushi-baked-caesar",name:"Запечённый цезарь",price:2590,image:"assets/sushi/baked-caesar.webp"},
    {id:"sushi-salmon-maki",name:"Ролл с лососем",price:1400,image:"assets/sushi/salmon-maki.webp"},
    {id:"sushi-spice-roll",name:"Спайс ролл",price:1200,image:"assets/sushi/spice-roll.webp"},
    {id:"sushi-tomato-maki",name:"Томато маки",price:700,image:"assets/sushi/tomato-maki.webp"},
    {id:"sushi-tobiko-maki",name:"Ролл Тобико",price:700,image:"assets/sushi/tobiko-maki.webp"},
    {id:"sushi-cucumber-maki",name:"Ролл с огурцом",price:900,image:"assets/sushi/cucumber-maki.webp"}
  ]},
  { id:"drinks", name:"Напитки", icon:"🥤", items:[
    {id:"ayran",name:"Айран",price:250,image:"assets/menu/ayran.webp"},{id:"cola-05",name:"Coca-Cola 0.5 л",price:550,image:"assets/menu/cola-05.webp"},{id:"cola-can",name:"Coca-Cola банка",price:550,image:"assets/menu/cola-can.webp"},
    {id:"sprite-can",name:"Sprite банка",price:550,image:"assets/menu/sprite-can.webp"},{id:"fanta-can",name:"Fanta банка",price:550,image:"assets/menu/fanta-can.webp"},{id:"fuse",name:"Fuse Tea",price:550,image:"assets/menu/fuse-05.webp"},
    {id:"maxi",name:"Maxi Tea",price:550,image:"assets/menu/maxi-05.webp"},{id:"mojito",name:"Mojito",price:550,image:"assets/menu/mojito-05.webp"},{id:"cola-1",name:"Coca-Cola 1 л",price:780,image:"assets/menu/cola-1.webp"},
    {id:"fuse-1",name:"Fuse Tea 1 л",price:780,image:"assets/menu/fuse-1.webp"},{id:"maxi-1",name:"Maxi Tea 1 л",price:780,image:"assets/menu/maxi-1.webp"},{id:"cola-15",name:"Coca-Cola 1.5 л",price:1000,image:"assets/menu/cola-15.webp"},
    {id:"fuse-15",name:"Fuse Tea 1.5 л",price:1000,image:"assets/menu/fuse-15.webp"},{id:"cola-2",name:"Coca-Cola 2 л",price:1300,image:"assets/menu/cola-2.webp"}
  ]},
  { id:"east", name:"Восточка", icon:"🍜", items:[
    {id:"lagman-guyru",name:"Гуйру лағман",price:1600,image:"assets/menu/guyru-lagman.webp"},{id:"lagman-suyru",name:"Суйру лағман",price:1600,image:"assets/menu/suyru-lagman.webp"},
    {id:"lagman-guyru-tsomyan",name:"Гуйру цомян",price:1800,image:"assets/menu/guyru-tsomyan.webp"},{id:"lagman-suyru-tsomyan",name:"Суйру цомян",price:1800,image:"assets/menu/suyru-tsomyan.webp"},
    {id:"lagman-moguru",name:"Могуру",price:1900,image:"assets/menu/moguru.webp"},{id:"lagman-moshuru",name:"Мошуру",price:2000,image:"assets/menu/moshuru.webp"},{id:"lagman-hauhau",name:"Хаухау",price:2000,image:"assets/menu/hauhau.webp"}
  ]},
  { id:"fish", name:"Рыба", icon:"🐟", items:[
    {id:"fish-sudak",name:"Судак",image:"assets/menu/fish-assorti.webp",options:[{id:"500g",name:"500 г",price:3300},{id:"700g",name:"700 г",price:4100},{id:"1kg",name:"1 кг",price:6100},{id:"1.5kg",name:"1.5 кг",price:8800}]},
    {id:"fish-sazan",name:"Сазан",image:"assets/menu/fish-assorti.webp",options:[{id:"500g",name:"500 г",price:3300},{id:"700g",name:"700 г",price:4100},{id:"1kg",name:"1 кг",price:6100},{id:"1.5kg",name:"1.5 кг",price:8800}]},
    {id:"fish-assorti",name:"Ассорти",image:"assets/menu/fish-assorti.webp",options:[{id:"1kg",name:"1 кг",price:6100},{id:"1.5kg",name:"1.5 кг",price:8800}]}
  ]}
];

const zoneRules = {
  baktybai:{name:"Бақтыбай"},eltai:{name:"Елтай",fee:500},otenai:{name:"Өтенай",fee:800},"balpyk-bi":{name:"Балпық би",fee:2000}
};
const productIndex = new Map();
sets.forEach(item => productIndex.set(item.id,item));
sushiSets.forEach(item => productIndex.set(item.id,item));
categories.forEach(category => category.items.forEach(item => productIndex.set(item.id,{...item,icon:category.icon,categoryId:category.id})));

let cart = readCart();
let customizingProductId = null;
let cartCount = 0;
let cartTotal = 0;
let statusPollTimer = null;
let productAvailability = new Map();
let setModalProductId = null, setModalQuantity = 1;
const money = amount => `${new Intl.NumberFormat("ru-RU").format(amount)} ₸`;
const escapeHTML = value => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c]));

function sanitizeCartRows(value){return Array.isArray(value)?value.filter(row=>row&&typeof row.productId==="string"&&productIndex.has(row.productId)):[]}
function readCart(){if(typeof localStorage==="undefined")return[];try{const value=JSON.parse(localStorage.getItem("baiFoodCart")||"[]"),cleaned=sanitizeCartRows(value);if(!Array.isArray(value)||cleaned.length!==value.length)localStorage.setItem("baiFoodCart",JSON.stringify(cleaned));return cleaned}catch{return[]}}
function saveCart(){if(typeof localStorage!=="undefined")localStorage.setItem("baiFoodCart",JSON.stringify(cart))}
function itemBasePrice(product){return product.options?product.options[0].price:product.price}
function itemLabel(row){const product=productIndex.get(row.productId);return [product.name,row.variantName,...row.addons.map(a=>a.name)].filter(Boolean).join(" — ")}
function ordinarySubtotal(){return cart.filter(row=>!productIndex.get(row.productId).isPromo).reduce((sum,row)=>sum+row.unitPrice*row.quantity,0)}
function productsSubtotal(){return cart.reduce((sum,row)=>sum+row.unitPrice*row.quantity,0)}
function qualifiesForGift(){return ordinarySubtotal()>GIFT_THRESHOLD}
function donerQuantity(){return cart.filter(row=>productIndex.get(row.productId)?.categoryId==="doner").reduce((sum,row)=>sum+row.quantity,0)}
function freeAyranQuantity(){return Math.floor(donerQuantity()/4)*4}
function qualifiesForAyranGift(){return freeAyranQuantity()>0}
function getPepperoniGiftItem(){return qualifiesForGift()?{product_id:"gift-pepperoni",name:"Пепперони — ПОДАРОК ПО АКЦИИ",quantity:1,price:0,is_gift:true}:null}
function getAyranGiftItem(){const quantity=freeAyranQuantity();return quantity?{product_id:"gift-ayran",name:`Айран — ПОДАРОК ПО АКЦИИ ×${quantity}`,quantity,price:0,is_gift:true}:null}
function getGiftItems(){return [getPepperoniGiftItem(),getAyranGiftItem()].filter(Boolean)}
function getGiftItem(){return getPepperoniGiftItem()}
function resolveVariantId(row){const product=productIndex.get(row.productId);return row.variantId||product?.options?.find(option=>option.name===row.variantName)?.id||null}
function getOrderItems(){const items=cart.map(row=>({name:itemLabel(row),quantity:row.quantity,price:row.unitPrice,product_id:row.productId,variant_id:resolveVariantId(row),addon_ids:row.addons.map(addon=>addon.id),is_promo:Boolean(productIndex.get(row.productId).isPromo)}));return items.concat(getGiftItems())}

function renderNavigation(){
  document.getElementById("categories").innerHTML=[
    `<button class="category active" data-target="promotions">🔥 Акции</button>`,
    `<button class="category" data-target="sets">🍱 Сеты</button>`,
    `<button class="category" data-target="sushi-sets">🍱 Суши сеты</button>`,
    `<button class="category" data-target="category-doner">🌯 Фастфуд</button>`,
    `<button class="category" data-target="category-sushi">🍣 Суши</button>`,
    `<button class="category" data-target="category-east">🍜 Восточка</button>`,
    `<button class="category" data-target="category-fish">🐟 Рыба</button>`,
    `<button class="category" data-target="category-drinks">🥤 Напитки</button>`
  ].join("");
  document.getElementById("categories").addEventListener("click",event=>{const button=event.target.closest("[data-target]");if(!button)return;document.querySelectorAll(".category").forEach(node=>node.classList.toggle("active",node===button));document.getElementById(button.dataset.target)?.scrollIntoView({behavior:"smooth"})});
}

function isStopped(productId){return productAvailability.get(productId)===true}
function productCard(product,icon){
  const stopped=isStopped(product.id);
  const isSet=sets.some(x=>x.id===product.id)||sushiSets.some(x=>x.id===product.id);
  const count=cart.filter(row=>row.productId===product.id).reduce((sum,row)=>sum+row.quantity,0);
  const customizable=Boolean(product.options||product.addons);
  const price=product.options?`от ${money(product.options[0].price)}`:money(product.price);
  const visual=product.image?`<img src="${product.image}" alt="${escapeHTML(product.name)}">`:`<div class="product-placeholder">${icon||product.icon||"🍽️"}</div><span class="photo-note">Фото будет добавлено</span>`;
  return `<article class="product ${stopped?"stopped":""} ${isSet?"set-clickable":""}" data-product-id="${product.id}" ${isSet?`onclick="openSetModal('${product.id}')"`:""}>
    <div class="product-image">${product.isPromo?'<span class="hit-badge">АКЦИЯ</span>':""}${stopped?'<span class="stop-badge">СТОП</span>':""}${visual}</div>
    <div class="product-content"><h3>${escapeHTML(product.name)}</h3><p class="product-description">${escapeHTML(product.description|| (customizable?"Выберите вариант и добавки":"BAI FOOD"))}</p>
    <div class="product-bottom"><div><strong class="price">${price}</strong>${customizable?'<small class="customize-hint">Настраивается</small>':""}</div>
    <div class="quantity"><button class="minus-button" type="button" onclick="event.stopPropagation();removeProduct('${product.id}')">−</button><span id="count-${product.id}">${count}</span><button class="add-button" type="button" ${stopped?"disabled":""} onclick="event.stopPropagation();selectProduct('${product.id}')">+</button></div></div></div></article>`;
}

async function loadAvailability(){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/product_availability?select=product_id,is_stopped`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});if(!r.ok)return;productAvailability=new Map((await r.json()).map(x=>[x.product_id,Boolean(x.is_stopped)]));renderMenu()}catch(e){console.warn("STOP-list unavailable",e)}}
function openSetModal(productId){const p=productIndex.get(productId);if(!p||isStopped(productId))return;setModalProductId=productId;setModalQuantity=1;document.getElementById("set-modal-photo").innerHTML=`<img src="${p.image}" alt="${escapeHTML(p.name)}">`;document.getElementById("set-modal-title").textContent=p.name;document.getElementById("set-modal-description").textContent=p.description||"Состав уточняется";document.getElementById("set-modal-price").textContent=money(p.price);document.getElementById("set-modal-quantity").textContent="1";showModal("set-modal")}
function closeSetModal(){hideModal("set-modal");setModalProductId=null;setModalQuantity=1}
function changeSetModalQuantity(delta){setModalQuantity=Math.max(1,Math.min(20,setModalQuantity+delta));document.getElementById("set-modal-quantity").textContent=String(setModalQuantity)}
function addSetFromModal(){const p=productIndex.get(setModalProductId);if(!p||isStopped(p.id))return;for(let i=0;i<setModalQuantity;i++)addConfiguredItem(p.id,"",[],p.price);closeSetModal()}

function renderMenu(){
  document.getElementById("sets-grid").innerHTML=sets.map(p=>productCard(p,p.icon)).join("");
  document.getElementById("sushi-sets-grid").innerHTML=sushiSets.map(p=>productCard(p,p.icon)).join("");
  document.getElementById("menu-root").innerHTML=categories.map(category=>{
    const items=category.items;
    return `<section class="menu-section" id="category-${category.id}"><div class="section-title"><h2>${category.icon} ${escapeHTML(category.name)}</h2><span>${items.length} поз.</span></div><div class="products-grid">${items.map(p=>productCard(p,category.icon)).join("")}</div></section>`;
  }).join("");
}

function selectProduct(productId){const product=productIndex.get(productId);if(!product||isStopped(productId))return;if(product.options||product.addons)openCustomize(productId);else addConfiguredItem(productId,"",[],product.price)}
function openCustomize(productId){
  const product=productIndex.get(productId);customizingProductId=productId;
  document.getElementById("customize-title").textContent=product.name;
  document.getElementById("customize-description").textContent=product.description||"Выберите подходящий вариант";
  document.getElementById("customize-photo").innerHTML=product.image?`<img src="${product.image}" alt="${escapeHTML(product.name)}">`:(product.icon||categories.find(c=>c.id===product.categoryId)?.icon||"🍽️");
  document.getElementById("variant-options").innerHTML=product.options?`<div class="option-group"><strong>Вариант</strong><div class="option-list">${product.options.map((o,i)=>`<label><span><input type="radio" name="custom-variant" value="${i}" ${i===0?"checked":""}> ${escapeHTML(o.name)}</span><b>${money(o.price)}</b></label>`).join("")}</div></div>`:"";
  document.getElementById("addon-options").innerHTML=product.addons?`<div class="option-group"><strong>Добавки</strong><div class="option-list">${product.addons.map(id=>{const a=ADDONS[id];return`<label><span><input type="checkbox" name="custom-addon" value="${a.id}"> ${escapeHTML(a.name)}</span><b>+${money(a.price)}</b></label>`}).join("")}</div></div>`:"";
  document.querySelectorAll('#customize-modal input').forEach(input=>input.addEventListener("change",updateCustomizeTotal));
  updateCustomizeTotal();showModal("customize-modal");
}
function updateCustomizeTotal(){const product=productIndex.get(customizingProductId);if(!product)return;const optionIndex=Number(document.querySelector('input[name="custom-variant"]:checked')?.value||0);let total=product.options?product.options[optionIndex].price:product.price;document.querySelectorAll('input[name="custom-addon"]:checked').forEach(input=>{total+=ADDONS[Object.keys(ADDONS).find(k=>ADDONS[k].id===input.value)].price});document.getElementById("customize-total").textContent=money(total)}
function confirmCustomizedItem(){const product=productIndex.get(customizingProductId);const optionIndex=Number(document.querySelector('input[name="custom-variant"]:checked')?.value||0);const variant=product.options?product.options[optionIndex]:null;const addons=[...document.querySelectorAll('input[name="custom-addon"]:checked')].map(input=>Object.values(ADDONS).find(a=>a.id===input.value));const price=(variant?.price??product.price)+addons.reduce((sum,a)=>sum+a.price,0);addConfiguredItem(product.id,variant?.name||"",addons,price,variant?.id||null);closeCustomize()}
function addConfiguredItem(productId,variantName,addons,unitPrice,variantId=null){const addonKey=addons.map(a=>a.id).sort().join(",");const key=`${productId}::${variantId||variantName}::${addonKey}`;const existing=cart.find(row=>row.key===key);if(existing)existing.quantity+=1;else cart.push({key,productId,variantId,variantName,addons,unitPrice,quantity:1});saveCart();refreshAll()}
function removeProduct(productId){const index=[...cart].map((row,i)=>({row,i})).reverse().find(entry=>entry.row.productId===productId)?.i;if(index===undefined)return;cart[index].quantity-=1;if(cart[index].quantity<=0)cart.splice(index,1);saveCart();refreshAll()}
function changeCartItem(key,delta){const row=cart.find(item=>item.key===key);if(!row)return;row.quantity+=delta;if(row.quantity<=0)cart=cart.filter(item=>item.key!==key);saveCart();refreshAll();renderCart()}
function refreshAll(){cartCount=cart.reduce((sum,row)=>sum+row.quantity,0)+getGiftItems().reduce((sum,item)=>sum+item.quantity,0);cartTotal=productsSubtotal();document.getElementById("cart-info").textContent=`${cartCount} товар — ${money(cartTotal)}`;document.getElementById("nav-cart-count").textContent=cartCount;document.querySelectorAll("[id^='count-']").forEach(node=>{const id=node.id.replace("count-","");node.textContent=cart.filter(row=>row.productId===id).reduce((sum,row)=>sum+row.quantity,0)});updateCheckoutSummary()}

function renderCart(){
  const container=document.getElementById("cart-items");
  container.innerHTML=cart.map(row=>`<div class="cart-item"><div><h4>${escapeHTML(itemLabel(row))}</h4><small>${money(row.unitPrice)} за позицию</small><div class="quantity"><button onclick="changeCartItem('${escapeHTML(row.key)}',-1)">−</button><b>${row.quantity}</b><button onclick="changeCartItem('${escapeHTML(row.key)}',1)">+</button></div></div><div class="cart-item-price">${money(row.unitPrice*row.quantity)}</div></div>`).join("");
  getGiftItems().forEach(gift=>container.insertAdjacentHTML("beforeend",`<div class="gift-item"><strong>🎁 ${escapeHTML(gift.name)}</strong><br><small>${gift.quantity} × 0 ₸</small></div>`));
  const ordinary=ordinarySubtotal(),doners=donerQuantity(),freeAyran=freeAyranQuantity(),progress=document.getElementById("gift-progress"),pepperoniText=qualifiesForGift()?`Пепперони добавлена. Обычные товары: <strong>${money(ordinary)}</strong>.`:`До подарочной Пепперони не хватает <strong>${money(Math.max(0,GIFT_THRESHOLD+1-ordinary))}</strong>.`,ayranText=freeAyran?`Добавлено подарочных айранов: <strong>${freeAyran}</strong>.`:`До 4 подарочных айранов: ещё <strong>${4-doners}</strong> донер(а).`;progress.innerHTML=`🎁 ${pepperoniText} Сеты и комбо не учитываются.<br>🥛 ${ayranText}`;
  document.getElementById("cart-subtotal").textContent=money(productsSubtotal());document.getElementById("cart-total").textContent=`Итого: ${money(productsSubtotal())}`;
}
function showModal(id){document.getElementById(id).style.display="flex";document.getElementById(id).setAttribute("aria-hidden","false");document.body.classList.add("modal-open")}
function hideModal(id){document.getElementById(id).style.display="none";document.getElementById(id).setAttribute("aria-hidden","true");if(![...document.querySelectorAll(".cart-modal")].some(m=>m.style.display==="flex"))document.body.classList.remove("modal-open")}
function openCart(){if(!cart.length){alert("Корзина пуста");return}renderCart();showModal("cart-modal")}
function closeCart(){hideModal("cart-modal")}function closeCustomize(){hideModal("customize-modal")}function closeCheckout(){hideModal("checkout-modal")}
function openCheckout(){if(!cart.length)return;closeCart();syncCheckoutFields();updateCheckoutSummary();showModal("checkout-modal")}

function getAlmatyHour(date=new Date()){return Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Almaty",hour:"2-digit",hour12:false}).format(date))}
function calculateDeliveryFee(zone,subtotal,date=new Date()){if(zone!=="baktybai")return zoneRules[zone]?.fee??0;return getAlmatyHour(date)<17&&subtotal>=3000?0:500}
function getCheckoutState(date=new Date()){const orderType=document.querySelector('input[name="orderType"]:checked')?.value||"В заведении";const zone=document.getElementById("delivery-zone").value;const subtotal=productsSubtotal();const deliveryFee=orderType==="Доставка"?calculateDeliveryFee(zone,subtotal,date):0;return{orderType,zone,zoneName:zoneRules[zone].name,subtotal,deliveryFee,total:subtotal+deliveryFee}}
function updateCheckoutSummary(){const state=getCheckoutState();document.getElementById("checkout-products-total").textContent=money(state.subtotal);document.getElementById("checkout-delivery-fee").textContent=state.orderType==="Доставка"?(state.deliveryFee===0?"Бесплатно":money(state.deliveryFee)):"—";document.getElementById("checkout-grand-total").textContent=money(state.total);document.getElementById("delivery-explanation").textContent=deliveryExplanation(state);document.getElementById("cash-caption").textContent=state.orderType==="Доставка"?"Оплата курьеру":"Оплата кассиру"}
function deliveryExplanation(state){if(state.orderType!=="Доставка")return"";if(state.zone!=="baktybai")return`${state.zoneName}: фиксированная доставка ${money(state.deliveryFee)}.`;const before=getAlmatyHour()<17;if(before&&state.deliveryFee===0)return"Бақтыбай: до 17:00 и товары от 3 000 ₸ — доставка бесплатная.";if(before)return"Бақтыбай: до 17:00 при сумме товаров меньше 3 000 ₸ доставка 500 ₸.";return"Бақтыбай: после 17:00 доставка 500 ₸ независимо от суммы."}
function syncCheckoutFields(){const delivery=document.querySelector('input[name="orderType"]:checked').value==="Доставка";document.getElementById("table-field").style.display=delivery?"none":"block";document.getElementById("delivery-fields").style.display=delivery?"block":"none";updateCheckoutSummary()}

async function postRpc(name,body){return fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`},body:JSON.stringify(body)})}
async function saveOrderToSupabase(order){
  const v2=await postRpc("create_order_v2",{p_customer_name:order.customer_name,p_phone:order.phone,p_order_type:order.order_type,p_table_number:order.table_number,p_address:order.address,p_items:order.items,p_items_subtotal:order.items_subtotal,p_delivery_zone:order.delivery_zone,p_delivery_fee:order.delivery_fee,p_total:order.total,p_payment_method:order.payment_method,p_cash_change_mode:order.cash_change_mode,p_cash_change_from:order.cash_change_from});
  if(v2.ok)return{id:await v2.json(),mode:"v2"};
  const errorText=await v2.text();if(!/PGRST202|404|Could not find the function/i.test(errorText))throw new Error(errorText);
  const fallbackItems=[...order.items];if(order.order_type==="delivery")fallbackItems.push({name:`Доставка — ${order.delivery_zone}`,quantity:1,price:order.delivery_fee,is_delivery:true,zone:order.delivery_zone});
  const legacy=await postRpc("create_order",{p_customer_name:order.customer_name,p_phone:order.phone,p_order_type:order.order_type,p_table_number:order.table_number,p_address:order.order_type==="delivery"?`[${order.delivery_zone}] ${order.address}`:order.address,p_items:fallbackItems,p_total:order.total,p_payment_method:order.payment_method});
  if(!legacy.ok)throw new Error(await legacy.text());return{id:await legacy.json(),mode:"legacy"}
}

function openKaspiPay(targetWindow=null){if(targetWindow&&!targetWindow.closed){targetWindow.location.href=KASPI_PAY_URL;return true}return Boolean(window.open(KASPI_PAY_URL,"_blank","noopener,noreferrer"))}
async function saveOrderAndOpenPayment(payment,order,{save=saveOrderToSupabase,openKaspi=openKaspiPay,targetWindow=null}={}){try{const saved=await save(order);if(payment==="Kaspi перевод")openKaspi(targetWindow);return saved}catch(error){if(targetWindow&&!targetWindow.closed)targetWindow.close();throw error}}

function calculateCashChange(total,mode,amount){if(mode!=="change")return{mode:"none",from:null,change:0,valid:true};const from=Number(amount);return{mode:"change",from:Number.isFinite(from)?from:null,change:Number.isFinite(from)?from-total:0,valid:Number.isFinite(from)&&from>=total}}
function getCashChangeState(total=getCheckoutState().total){const payment=document.querySelector('input[name="payment"]:checked')?.value||"Наличными",mode=document.querySelector('input[name="cashChangeMode"]:checked')?.value||"none",amount=document.getElementById("cash-change-from").value;return payment==="Наличными"?calculateCashChange(total,mode,amount):{mode:null,from:null,change:0,valid:true}}
function updateCashChange(){const payment=document.querySelector('input[name="payment"]:checked')?.value||"Наличными",cash=document.getElementById("cash-change"),mode=document.querySelector('input[name="cashChangeMode"]:checked')?.value||"none",wrap=document.getElementById("cash-change-amount-wrap"),result=document.getElementById("cash-change-result");cash.style.display=payment==="Наличными"?"block":"none";wrap.hidden=payment!=="Наличными"||mode!=="change";if(payment!=="Наличными"||mode!=="change"){result.textContent="";return}const change=getCashChangeState();result.textContent=change.valid?`Сдача: ${money(change.change)}`:"";result.classList.remove("error")}

async function sendOrder(){
  if(!cart.length)return;
  const name=document.getElementById("customer-name").value.trim();const phone=document.getElementById("customer-phone").value.trim();const address=document.getElementById("customer-address").value.trim();const table=document.getElementById("table-number").value.trim();const payment=document.querySelector('input[name="payment"]:checked').value;const state=getCheckoutState();const cashChange=getCashChangeState(state.total);const error=document.getElementById("checkout-error");
  error.style.display="none";if(!name)return showCheckoutError("Введите ваше имя.");if(state.orderType==="В заведении"&&!table)return showCheckoutError("Введите номер стола.");if(state.orderType==="Доставка"&&(!phone||!address))return showCheckoutError("Для доставки укажите телефон и адрес.");if(!cashChange.valid)return showCheckoutError("Сумма для сдачи не может быть меньше итога заказа.");
  const button=document.getElementById("submit-order-button");button.disabled=true;button.textContent="Отправляем...";
  const kaspiWindow=payment==="Kaspi перевод"?window.open("about:blank","_blank"):null;
  const items=getOrderItems();const order={customer_name:name,phone:state.orderType==="Доставка"?phone:null,order_type:state.orderType==="Доставка"?"delivery":"dine_in",table_number:state.orderType==="В заведении"?table:null,address:state.orderType==="Доставка"?address:null,items,items_subtotal:state.subtotal,delivery_zone:state.orderType==="Доставка"?state.zoneName:null,delivery_fee:state.deliveryFee,total:state.total,payment_method:payment==="Kaspi перевод"?"kaspi":"cash",cash_change_mode:payment==="Наличными"?cashChange.mode:null,cash_change_from:payment==="Наличными"?cashChange.from:null};
  try{const saved=await saveOrderAndOpenPayment(payment,order,{targetWindow:kaspiWindow});hideModal("checkout-modal");showSuccess(saved.id,state,payment,order);cart=[];saveCart();refreshAll()}catch(submitError){console.error(submitError);showCheckoutError("Не удалось отправить заказ. Проверьте интернет и попробуйте ещё раз.")}finally{button.disabled=false;button.textContent="Отправить заказ"}
}
function showCheckoutError(message){const error=document.getElementById("checkout-error");error.textContent=message;error.style.display="block"}
async function pollOrderStatus(orderId,order){try{const response=await postRpc("get_order_status_v2",{p_order_id:Number(orderId),p_customer_name:order.customer_name,p_phone:order.phone,p_table_number:order.table_number});if(!response.ok)return;const rows=await response.json(),status=Array.isArray(rows)?rows[0]:rows;if(status?.order_status==="cancelled"){document.getElementById("success-status").innerHTML=`<strong>Заказ не может быть выполнен.</strong><br>${escapeHTML(status.public_message||"Кассир свяжется с вами для уточнения.")}`;clearInterval(statusPollTimer);statusPollTimer=null;return}if(status?.accepted_at){document.getElementById("success-status").textContent=`Заказ принят. Примерное время ожидания: ${Number(status.prep_minutes)} минут`;clearInterval(statusPollTimer);statusPollTimer=null}}catch(error){console.warn("Status polling unavailable",error)}}
function showSuccess(orderId,state,payment,order){document.querySelector("#success-modal h2").textContent=`Заказ №${orderId} оформлен`;document.getElementById("success-total").textContent=`Итого: ${money(state.total)}`;document.getElementById("success-status").textContent="Ожидаем принятия заказа кассиром…";const paymentStatus=document.getElementById("success-payment-status"),primary=document.getElementById("success-primary"),secondary=document.getElementById("success-secondary");paymentStatus.hidden=payment!=="Kaspi перевод";paymentStatus.textContent="Ожидаем подтверждения оплаты кассиром";if(state.orderType==="Доставка"&&payment==="Наличными"){primary.textContent="Оплата наличными курьеру при получении.";secondary.textContent="Кассир подтвердит заказ и доставку."}else if(payment==="Kaspi перевод"){primary.textContent="Kaspi Pay открыт в новой вкладке.";secondary.textContent="Введите итоговую сумму вручную. Оплата подтвердится только после проверки кассиром."}else{primary.textContent="Покажите номер заказа кассиру.";secondary.textContent="Оплата наличными в заведении."}showModal("success-modal");clearInterval(statusPollTimer);pollOrderStatus(orderId,order);statusPollTimer=setInterval(()=>pollOrderStatus(orderId,order),4000)}
function closeSuccess(){clearInterval(statusPollTimer);statusPollTimer=null;hideModal("success-modal");window.scrollTo({top:0,behavior:"smooth"})}

if(typeof document!=="undefined"){
  document.querySelectorAll('input[name="orderType"]').forEach(input=>input.addEventListener("change",syncCheckoutFields));
  document.querySelectorAll('input[name="payment"]').forEach(input=>input.addEventListener("change",()=>{document.getElementById("kaspi-payment").style.display=input.checked&&input.value==="Kaspi перевод"?"block":"none";updateCashChange()}));
  document.querySelectorAll('input[name="cashChangeMode"]').forEach(input=>input.addEventListener("change",updateCashChange));
  document.getElementById("cash-change-from").addEventListener("input",updateCashChange);
  document.getElementById("delivery-zone").addEventListener("change",updateCheckoutSummary);
  ["set-modal","customize-modal","cart-modal","checkout-modal"].forEach(id=>document.getElementById(id).addEventListener("click",event=>{if(event.target.id===id)hideModal(id)}));
  renderNavigation();renderMenu();refreshAll();syncCheckoutFields();updateCashChange();loadAvailability();setInterval(loadAvailability,15000);
  window.BAI_FOOD_TEST={calculateDeliveryFee,getAlmatyHour,ordinarySubtotal,productsSubtotal,qualifiesForGift,donerQuantity,freeAyranQuantity,qualifiesForAyranGift,getGiftItems,getOrderItems,getCheckoutState,calculateCashChange,sanitizeCartRows,saveOrderAndOpenPayment,KASPI_PAY_URL,categories,sets,sushiSets,productIndex,setCart:value=>{cart=value;saveCart();refreshAll()}};
}
if(typeof module!=="undefined")module.exports={calculateDeliveryFee,getAlmatyHour,ordinarySubtotal,productsSubtotal,qualifiesForGift,donerQuantity,freeAyranQuantity,qualifiesForAyranGift,getGiftItems,getOrderItems,calculateCashChange,sanitizeCartRows,saveOrderAndOpenPayment,KASPI_PAY_URL,categories,sets,sushiSets,productIndex,setCart:value=>{cart=value}};
