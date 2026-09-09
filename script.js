// ===============================
// BAI FOOD — CLIENT + SUPABASE
// ===============================

const SUPABASE_URL =
  "https://elzjmbwkgleuzpybiqdg.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsemptYndrZ2xldXpweWJpcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDA1OTEsImV4cCI6MjEwNDA3NjU5MX0.JtcrSCdtV20YrMIyqYI66SjywOgGa4CVRqFRdpCujLg";


// ===============================
// КОРЗИНА
// ===============================

let cartCount = 0;
let cartTotal = 0;

let philadelphiaCount = 0;
let californiaCount = 0;
let burgerCount = 0;
let alaskaCount = 0;
let bonitoCount = 0;

let bubble05Count = 0;
let bubble07Count = 0;
let lemonade05Count = 0;
let lemonade07Count = 0;


// ===============================
// ОБНОВЛЕНИЕ КОРЗИНЫ
// ===============================

function updateCartInfo() {

  const cartInfo =
    document.getElementById(
      "cart-info"
    );

  if (cartInfo) {

    cartInfo.textContent =
      `${cartCount} товар — ${cartTotal.toLocaleString("ru-RU")} ₸`;

  }

}


function updateQuantityControl(
  countId,
  count
) {

  const countElement =
    document.getElementById(
      countId
    );

  if (!countElement) return;


  const quantity =
    countElement.closest(
      ".quantity"
    );

  if (!quantity) return;


  const minusButton =
    quantity.querySelector(
      ".minus-button"
    );


  countElement.textContent =
    count;


  if (count <= 0) {

    countElement.style.display =
      "none";

    if (minusButton) {

      minusButton.style.display =
        "none";

    }

  } else {

    countElement.style.display =
      "inline-flex";

    if (minusButton) {

      minusButton.style.display =
        "inline-flex";

    }

  }

}


// ===============================
// ФИЛАДЕЛЬФИЯ
// ===============================

function addToCart() {

  philadelphiaCount++;
  cartCount++;

  cartTotal += 2790;

  updateQuantityControl(
    "item-count",
    philadelphiaCount
  );

  updateCartInfo();

}


function removeFromCart() {

  if (
    philadelphiaCount <= 0
  ) return;


  philadelphiaCount--;
  cartCount--;

  cartTotal -= 2790;


  updateQuantityControl(
    "item-count",
    philadelphiaCount
  );

  updateCartInfo();

}


// ===============================
// КАЛИФОРНИЯ
// ===============================

function addCalifornia() {

  californiaCount++;
  cartCount++;

  cartTotal += 2490;


  updateQuantityControl(
    "california-count",
    californiaCount
  );

  updateCartInfo();

}


function removeCalifornia() {

  if (
    californiaCount <= 0
  ) return;


  californiaCount--;
  cartCount--;

  cartTotal -= 2490;


  updateQuantityControl(
    "california-count",
    californiaCount
  );

  updateCartInfo();

}


// ===============================
// ЧИЗБУРГЕР
// ===============================

function addBurger() {

  burgerCount++;
  cartCount++;

  cartTotal += 1650;


  updateQuantityControl(
    "burger-count",
    burgerCount
  );

  updateCartInfo();

}


function removeBurger() {

  if (
    burgerCount <= 0
  ) return;


  burgerCount--;
  cartCount--;

  cartTotal -= 1650;


  updateQuantityControl(
    "burger-count",
    burgerCount
  );

  updateCartInfo();

}


// ===============================
// АЛЯСКА
// ===============================

function addAlaska() {

  alaskaCount++;
  cartCount++;

  cartTotal += 2390;


  updateQuantityControl(
    "alaska-count",
    alaskaCount
  );

  updateCartInfo();

}


function removeAlaska() {

  if (
    alaskaCount <= 0
  ) return;


  alaskaCount--;
  cartCount--;

  cartTotal -= 2390;


  updateQuantityControl(
    "alaska-count",
    alaskaCount
  );

  updateCartInfo();

}


// ===============================
// БОНИТО
// ===============================

function addBonito() {

  bonitoCount++;
  cartCount++;

  cartTotal += 2190;


  updateQuantityControl(
    "bonito-count",
    bonitoCount
  );

  updateCartInfo();

}


function removeBonito() {

  if (
    bonitoCount <= 0
  ) return;


  bonitoCount--;
  cartCount--;

  cartTotal -= 2190;


  updateQuantityControl(
    "bonito-count",
    bonitoCount
  );

  updateCartInfo();

}


// ===============================
// BUBBLE TEA 0.5
// ===============================

function addBubble05() {

  bubble05Count++;
  cartCount++;

  cartTotal += 1300;


  updateQuantityControl(
    "bubble05-count",
    bubble05Count
  );

  updateCartInfo();

}


function removeBubble05() {

  if (
    bubble05Count <= 0
  ) return;


  bubble05Count--;
  cartCount--;

  cartTotal -= 1300;


  updateQuantityControl(
    "bubble05-count",
    bubble05Count
  );

  updateCartInfo();

}


// ===============================
// BUBBLE TEA 0.7
// ===============================

function addBubble07() {

  bubble07Count++;
  cartCount++;

  cartTotal += 1500;


  updateQuantityControl(
    "bubble07-count",
    bubble07Count
  );

  updateCartInfo();

}


function removeBubble07() {

  if (
    bubble07Count <= 0
  ) return;


  bubble07Count--;
  cartCount--;

  cartTotal -= 1500;


  updateQuantityControl(
    "bubble07-count",
    bubble07Count
  );

  updateCartInfo();

}


// ===============================
// ЛИМОНАД 0.5
// ===============================

function addLemonade05() {

  lemonade05Count++;
  cartCount++;

  cartTotal += 700;


  updateQuantityControl(
    "lemonade05-count",
    lemonade05Count
  );

  updateCartInfo();

}


function removeLemonade05() {

  if (
    lemonade05Count <= 0
  ) return;


  lemonade05Count--;
  cartCount--;

  cartTotal -= 700;


  updateQuantityControl(
    "lemonade05-count",
    lemonade05Count
  );

  updateCartInfo();

}


// ===============================
// ЛИМОНАД 0.7
// ===============================

function addLemonade07() {

  lemonade07Count++;
  cartCount++;

  cartTotal += 900;


  updateQuantityControl(
    "lemonade07-count",
    lemonade07Count
  );

  updateCartInfo();

}


function removeLemonade07() {

  if (
    lemonade07Count <= 0
  ) return;


  lemonade07Count--;
  cartCount--;

  cartTotal -= 900;


  updateQuantityControl(
    "lemonade07-count",
    lemonade07Count
  );

  updateCartInfo();

}


// ===============================
// ТОВАРЫ ЗАКАЗА
// ===============================

function getOrderItems() {

  const items = [];


  if (
    philadelphiaCount > 0
  ) {

    items.push({

      name:
        "Филадельфия",

      quantity:
        philadelphiaCount,

      price:
        2790

    });

  }


  if (
    californiaCount > 0
  ) {

    items.push({

      name:
        "Калифорния",

      quantity:
        californiaCount,

      price:
        2490

    });

  }


  if (
    burgerCount > 0
  ) {

    items.push({

      name:
        "Чизбургер",

      quantity:
        burgerCount,

      price:
        1650

    });

  }


  if (
    alaskaCount > 0
  ) {

    items.push({

      name:
        "Аляска",

      quantity:
        alaskaCount,

      price:
        2390

    });

  }


  if (
    bonitoCount > 0
  ) {

    items.push({

      name:
        "Бонито",

      quantity:
        bonitoCount,

      price:
        2190

    });

  }


  if (
    bubble05Count > 0
  ) {

    items.push({

      name:
        "Bubble Tea 0.5 L",

      quantity:
        bubble05Count,

      price:
        1300

    });

  }


  if (
    bubble07Count > 0
  ) {

    items.push({

      name:
        "Bubble Tea 0.7 L",

      quantity:
        bubble07Count,

      price:
        1500

    });

  }


  if (
    lemonade05Count > 0
  ) {

    items.push({

      name:
        "Лимонад 0.5 L",

      quantity:
        lemonade05Count,

      price:
        700

    });

  }


  if (
    lemonade07Count > 0
  ) {

    items.push({

      name:
        "Лимонад 0.7 L",

      quantity:
        lemonade07Count,

      price:
        900

    });

  }


  return items;

}


// ===============================
// ОТКРЫТЬ КОРЗИНУ
// ===============================

function openCart() {

  if (
    cartCount === 0
  ) {

    alert(
      "Корзина пуста"
    );

    return;

  }


  const modal =
    document.getElementById(
      "cart-modal"
    );


  const cartItems =
    document.getElementById(
      "cart-items"
    );


  const cartTotalElement =
    document.getElementById(
      "cart-total"
    );


  const items =
    getOrderItems();


  cartItems.innerHTML = "";


  items.forEach(
    item => {

      const row =
        document.createElement(
          "p"
        );


      row.textContent =
        `${item.name} × ${item.quantity} — ${(item.price * item.quantity).toLocaleString("ru-RU")} ₸`;


      cartItems.appendChild(
        row
      );

    }
  );


  cartTotalElement.textContent =
    `Итого: ${cartTotal.toLocaleString("ru-RU")} ₸`;


  modal.style.display =
    "flex";

}


function closeCart() {

  document.getElementById(
    "cart-modal"
  ).style.display =
    "none";

}


// ===============================
// CHECKOUT
// ===============================

function openCheckout() {

  if (
    cartCount === 0
  ) {

    alert(
      "Корзина пуста"
    );

    return;

  }


  closeCart();


  document.getElementById(
    "checkout-modal"
  ).style.display =
    "flex";

}


function closeCheckout() {

  document.getElementById(
    "checkout-modal"
  ).style.display =
    "none";

}


// ===============================
// СОХРАНЕНИЕ В SUPABASE
// ===============================

async function saveOrderToSupabase(
  order
) {

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/create_order`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_ANON_KEY,

          "Authorization":
            `Bearer ${SUPABASE_ANON_KEY}`

        },

        body:
          JSON.stringify({

            p_customer_name:
              order.customer_name,

            p_phone:
              order.phone,

            p_order_type:
              order.order_type,

            p_table_number:
              order.table_number,

            p_address:
              order.address,

            p_items:
              order.items,

            p_total:
              order.total,

            p_payment_method:
              order.payment_method

          })

      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();


    console.error(
      "Supabase error:",
      errorText
    );


    throw new Error(
      errorText
    );

  }


  const orderId =
    await response.json();


  return {
    id: orderId
  };

}


// ===============================
// ОТПРАВИТЬ ЗАКАЗ
// ===============================

async function sendOrder() {

  if (
    cartCount === 0
  ) {

    alert(
      "Корзина пуста"
    );

    return;

  }


  const name =
    document
      .getElementById(
        "customer-name"
      )
      .value
      .trim();


  const phone =
    document
      .getElementById(
        "customer-phone"
      )
      .value
      .trim();


  const address =
    document
      .getElementById(
        "customer-address"
      )
      .value
      .trim();


  const tableNumber =
    document
      .getElementById(
        "table-number"
      )
      .value
      .trim();


  const orderTypeElement =
    document.querySelector(
      'input[name="orderType"]:checked'
    );


  const paymentElement =
    document.querySelector(
      'input[name="payment"]:checked'
    );


  const orderType =
    orderTypeElement
      ? orderTypeElement.value
      : "В заведении";


  const paymentMethod =
    paymentElement
      ? paymentElement.value
      : "Наличными";


  // -------------------------------
  // ПРОВЕРКА ИМЕНИ
  // -------------------------------

  if (!name) {

    alert(
      "Введите ваше имя"
    );

    return;

  }


  // -------------------------------
  // В ЗАВЕДЕНИИ
  // -------------------------------

  if (
    orderType ===
      "В заведении" &&
    !tableNumber
  ) {

    alert(
      "Введите номер стола"
    );

    return;

  }


  // -------------------------------
  // ДОСТАВКА
  // -------------------------------

  if (
    orderType ===
    "Доставка"
  ) {

    if (!phone) {

      alert(
        "Введите номер телефона"
      );

      return;

    }


    if (!address) {

      alert(
        "Введите адрес доставки"
      );

      return;

    }

  }


  const items =
    getOrderItems();


  const whatsappNumber =
    "77781577796";


  const button =
    document.querySelector(
      "#checkout-modal .checkout-button"
    );


  const oldText =
    button.textContent;


  button.disabled =
    true;


  button.textContent =
    "Отправляем...";


  try {

    // =============================
    // БАРЛЫҚ ЗАКАЗ SUPABASE-ҚА ТҮСЕДІ
    // =============================

    const savedOrder =
      await saveOrderToSupabase({

        customer_name:
          name,

        phone:
          phone || null,

        order_type:
          orderType ===
          "В заведении"
            ? "dine_in"
            : "delivery",

        table_number:
          orderType ===
          "В заведении"
            ? tableNumber
            : null,

        address:
          orderType ===
          "Доставка"
            ? address
            : null,

        items:
          items,

        total:
          cartTotal,

        payment_method:
          paymentMethod ===
          "Kaspi перевод"
            ? "kaspi"
            : "cash"

      });


    // =============================
    // KASPI
    // =============================
    // Kaspi болса:
    // 1. Заказ кассаға түсті
    // 2. Заказ номері бар
    // 3. WhatsApp қосымша ашылады
    // =============================

    if (
      paymentMethod ===
      "Kaspi перевод"
    ) {

      let message =
        `🆕 НОВЫЙ ЗАКАЗ №${savedOrder.id}\n\n`;


      message +=
        `👤 Клиент: ${name}\n`;


      message +=
        `📦 Тип заказа: ${orderType}\n`;


      if (
        orderType ===
        "В заведении"
      ) {

        message +=
          `🪑 Стол: ${tableNumber}\n`;

      } else {

        message +=
          `📞 Телефон: ${phone}\n`;


        message +=
          `📍 Адрес: ${address}\n`;

      }


      message +=
        "\n🍽 ЗАКАЗ:\n";


      items.forEach(
        item => {

          const itemTotal =
            item.price *
            item.quantity;


          message +=
            `${item.name} × ${item.quantity} — ${itemTotal.toLocaleString("ru-RU")} ₸\n`;

        }
      );


      message +=
        `\n💰 ИТОГО: ${cartTotal.toLocaleString("ru-RU")} ₸\n`;


      message +=
        "💳 Оплата: Kaspi перевод\n";


      message +=
        "⚠️ Кассиру: проверьте поступление оплаты в Kaspi.";


      const whatsappURL =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


      window.open(
        whatsappURL,
        "_blank"
      );

    }


    // Наличка болса WhatsApp ашылмайды.


    closeCheckout();


    showSuccess(

      savedOrder.id,

      paymentMethod ===
      "Kaspi перевод"
        ? "kaspi"
        : "cash"

    );

  } catch (error) {

    console.error(
      error
    );


    alert(
      "Не удалось отправить заказ. Проверьте интернет и попробуйте ещё раз."
    );

  } finally {

    button.disabled =
      false;


    button.textContent =
      oldText;

  }

}


// ===============================
// УСПЕШНЫЙ ЗАКАЗ
// ===============================

function showSuccess(
  orderId = null,
  paymentType = "cash"
) {

  const modal =
    document.getElementById(
      "success-modal"
    );


  const totalElement =
    document.getElementById(
      "success-total"
    );


  const title =
    modal.querySelector(
      "h2"
    );


  const paragraphs =
    modal.querySelectorAll(
      "p"
    );


  // -------------------------------
  // НАЛИЧНЫМИ
  // -------------------------------

  if (
    paymentType ===
    "cash"
  ) {

    title.textContent =
      orderId
        ? `Заказ №${orderId} принят`
        : "Заказ принят";


    if (
      paragraphs[0]
    ) {

      paragraphs[0].textContent =
        "Покажите номер заказа кассиру.";

    }


    if (
      paragraphs[1]
    ) {

      paragraphs[1].textContent =
        "Заказ начнут готовить после оплаты наличными.";

    }

  }


  // -------------------------------
  // KASPI
  // -------------------------------

  else {

    title.textContent =
      orderId
        ? `Заказ №${orderId} принят`
        : "Заказ принят";


    if (
      paragraphs[0]
    ) {

      paragraphs[0].textContent =
        "Kaspi перевод выбран.";

    }


    if (
      paragraphs[1]
    ) {

      paragraphs[1].textContent =
        "Кассир проверит поступление оплаты и подтвердит заказ.";

    }

  }


  totalElement.textContent =
    `Итого: ${cartTotal.toLocaleString("ru-RU")} ₸`;


  modal.style.display =
    "flex";

}


// ===============================
// НА ГЛАВНУЮ / СБРОС
// ===============================

function closeSuccess() {

  document.getElementById(
    "success-modal"
  ).style.display =
    "none";


  philadelphiaCount = 0;
  californiaCount = 0;
  burgerCount = 0;
  alaskaCount = 0;
  bonitoCount = 0;

  bubble05Count = 0;
  bubble07Count = 0;
  lemonade05Count = 0;
  lemonade07Count = 0;

  cartCount = 0;
  cartTotal = 0;


  updateQuantityControl(
    "item-count",
    philadelphiaCount
  );


  updateQuantityControl(
    "california-count",
    californiaCount
  );


  updateQuantityControl(
    "burger-count",
    burgerCount
  );


  updateQuantityControl(
    "alaska-count",
    alaskaCount
  );


  updateQuantityControl(
    "bonito-count",
    bonitoCount
  );


  updateQuantityControl(
    "bubble05-count",
    bubble05Count
  );


  updateQuantityControl(
    "bubble07-count",
    bubble07Count
  );


  updateQuantityControl(
    "lemonade05-count",
    lemonade05Count
  );


  updateQuantityControl(
    "lemonade07-count",
    lemonade07Count
  );


  updateCartInfo();


  const name =
    document.getElementById(
      "customer-name"
    );


  const phone =
    document.getElementById(
      "customer-phone"
    );


  const address =
    document.getElementById(
      "customer-address"
    );


  const table =
    document.getElementById(
      "table-number"
    );


  if (name) {
    name.value = "";
  }


  if (phone) {
    phone.value = "";
  }


  if (address) {
    address.value = "";
  }


  if (table) {
    table.value = "";
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ===============================
// СТАРТ САЙТА
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    // -------------------------------
    // ТОВАР САНДАРЫ
    // -------------------------------

    updateQuantityControl(
      "item-count",
      philadelphiaCount
    );


    updateQuantityControl(
      "california-count",
      californiaCount
    );


    updateQuantityControl(
      "burger-count",
      burgerCount
    );


    updateQuantityControl(
      "alaska-count",
      alaskaCount
    );


    updateQuantityControl(
      "bonito-count",
      bonitoCount
    );


    updateQuantityControl(
      "bubble05-count",
      bubble05Count
    );


    updateQuantityControl(
      "bubble07-count",
      bubble07Count
    );


    updateQuantityControl(
      "lemonade05-count",
      lemonade05Count
    );


    updateQuantityControl(
      "lemonade07-count",
      lemonade07Count
    );


    updateCartInfo();


    // =============================
    // ТИП ЗАКАЗА
    // =============================

    const orderTypes =
      document.querySelectorAll(
        'input[name="orderType"]'
      );


    const tableField =
      document.getElementById(
        "table-field"
      );


    const phoneInput =
      document.getElementById(
        "customer-phone"
      );


    const addressInput =
      document.getElementById(
        "customer-address"
      );


    function updateOrderFields() {

      const selected =
        document.querySelector(
          'input[name="orderType"]:checked'
        );


      if (!selected) {
        return;
      }


      // В ЗАВЕДЕНИИ

      if (
        selected.value ===
        "В заведении"
      ) {

        if (tableField) {

          tableField.style.display =
            "block";

        }


        if (phoneInput) {

          phoneInput.style.display =
            "none";

        }


        if (addressInput) {

          addressInput.style.display =
            "none";

        }

      }


      // ДОСТАВКА

      else {

        if (tableField) {

          tableField.style.display =
            "none";

        }


        if (phoneInput) {

          phoneInput.style.display =
            "block";

        }


        if (addressInput) {

          addressInput.style.display =
            "block";

        }

      }

    }


    orderTypes.forEach(
      radio => {

        radio.addEventListener(
          "change",
          updateOrderFields
        );

      }
    );


    updateOrderFields();


    // =============================
    // ОПЛАТА
    // =============================

    const paymentRadios =
      document.querySelectorAll(
        'input[name="payment"]'
      );


    const kaspiPayment =
      document.getElementById(
        "kaspi-payment"
      );


    function updatePayment() {

      const selected =
        document.querySelector(
          'input[name="payment"]:checked'
        );


      if (
        !selected ||
        !kaspiPayment
      ) {

        return;

      }


      if (
        selected.value ===
        "Kaspi перевод"
      ) {

        kaspiPayment.style.display =
          "block";

      } else {

        kaspiPayment.style.display =
          "none";

      }

    }


    paymentRadios.forEach(
      radio => {

        radio.addEventListener(
          "change",
          updatePayment
        );

      }
    );


    updatePayment();

  }
);