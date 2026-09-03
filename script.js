let cartCount = 0;
let cartTotal = 0;


// ==============================
// ТОВАР САНЫ
// ==============================

let philadelphiaCount = 0;
let californiaCount = 0;
let burgerCount = 0;

let alaskaCount = 0;
let bonitoCount = 0;

let bubble05Count = 0;
let bubble07Count = 0;
let lemonade05Count = 0;
let lemonade07Count = 0;


// ==============================
// КОРЗИНА АҚПАРАТЫ
// ==============================

function updateCartInfo() {

  document.getElementById("cart-info").textContent =
    `${cartCount} товар — ${cartTotal} ₸`;

}


// ==============================
// + / - БАТЫРМАЛАРЫ
// ==============================

function updateQuantityControl(countId, count) {

  let countElement =
    document.getElementById(countId);

  let quantity =
    countElement.closest(".quantity");

  let minusButton =
    quantity.querySelector(".minus-button");


  countElement.textContent = count;


  if (count === 0) {

    minusButton.style.display = "none";
    countElement.style.display = "none";

  } else {

    minusButton.style.display = "flex";
    countElement.style.display = "inline";

  }

}


// ==============================
// ФИЛАДЕЛЬФИЯ
// ==============================

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

  if (philadelphiaCount > 0) {

    philadelphiaCount--;
    cartCount--;
    cartTotal -= 2790;

    updateQuantityControl(
      "item-count",
      philadelphiaCount
    );

    updateCartInfo();

  }

}


// ==============================
// КАЛИФОРНИЯ
// ==============================

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

  if (californiaCount > 0) {

    californiaCount--;
    cartCount--;
    cartTotal -= 2490;

    updateQuantityControl(
      "california-count",
      californiaCount
    );

    updateCartInfo();

  }

}


// ==============================
// ЧИЗБУРГЕР
// ==============================

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

  if (burgerCount > 0) {

    burgerCount--;
    cartCount--;
    cartTotal -= 1650;

    updateQuantityControl(
      "burger-count",
      burgerCount
    );

    updateCartInfo();

  }

}


// ==============================
// АЛЯСКА
// ==============================

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

  if (alaskaCount > 0) {

    alaskaCount--;
    cartCount--;
    cartTotal -= 2390;

    updateQuantityControl(
      "alaska-count",
      alaskaCount
    );

    updateCartInfo();

  }

}


// ==============================
// БОНИТО
// ==============================

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

  if (bonitoCount > 0) {

    bonitoCount--;
    cartCount--;
    cartTotal -= 2190;

    updateQuantityControl(
      "bonito-count",
      bonitoCount
    );

    updateCartInfo();

  }

}


// ==============================
// BUBBLE TEA 0.5
// ==============================

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

  if (bubble05Count > 0) {

    bubble05Count--;
    cartCount--;
    cartTotal -= 1300;

    updateQuantityControl(
      "bubble05-count",
      bubble05Count
    );

    updateCartInfo();

  }

}


// ==============================
// BUBBLE TEA 0.7
// ==============================

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

  if (bubble07Count > 0) {

    bubble07Count--;
    cartCount--;
    cartTotal -= 1500;

    updateQuantityControl(
      "bubble07-count",
      bubble07Count
    );

    updateCartInfo();

  }

}


// ==============================
// ЛИМОНАД 0.5
// ==============================

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

  if (lemonade05Count > 0) {

    lemonade05Count--;
    cartCount--;
    cartTotal -= 700;

    updateQuantityControl(
      "lemonade05-count",
      lemonade05Count
    );

    updateCartInfo();

  }

}


// ==============================
// ЛИМОНАД 0.7
// ==============================

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

  if (lemonade07Count > 0) {

    lemonade07Count--;
    cartCount--;
    cartTotal -= 900;

    updateQuantityControl(
      "lemonade07-count",
      lemonade07Count
    );

    updateCartInfo();

  }

}


// ==============================
// КОРЗИНА
// ==============================

function openCart() {

  document.getElementById(
    "cart-modal"
  ).style.display = "flex";


  let items = "";


  if (philadelphiaCount > 0) {

    items += `
      <p>
        Филадельфия × ${philadelphiaCount}
        — ${philadelphiaCount * 2790} ₸
      </p>
    `;

  }


  if (californiaCount > 0) {

    items += `
      <p>
        Калифорния × ${californiaCount}
        — ${californiaCount * 2490} ₸
      </p>
    `;

  }


  if (burgerCount > 0) {

    items += `
      <p>
        Чизбургер × ${burgerCount}
        — ${burgerCount * 1650} ₸
      </p>
    `;

  }


  if (alaskaCount > 0) {

    items += `
      <p>
        Аляска × ${alaskaCount}
        — ${alaskaCount * 2390} ₸
      </p>
    `;

  }


  if (bonitoCount > 0) {

    items += `
      <p>
        Бонито × ${bonitoCount}
        — ${bonitoCount * 2190} ₸
      </p>
    `;

  }


  if (bubble05Count > 0) {

    items += `
      <p>
        Bubble Tea 0.5 л × ${bubble05Count}
        — ${bubble05Count * 1300} ₸
      </p>
    `;

  }


  if (bubble07Count > 0) {

    items += `
      <p>
        Bubble Tea 0.7 л × ${bubble07Count}
        — ${bubble07Count * 1500} ₸
      </p>
    `;

  }


  if (lemonade05Count > 0) {

    items += `
      <p>
        Лимонад 0.5 л × ${lemonade05Count}
        — ${lemonade05Count * 700} ₸
      </p>
    `;

  }


  if (lemonade07Count > 0) {

    items += `
      <p>
        Лимонад 0.7 л × ${lemonade07Count}
        — ${lemonade07Count * 900} ₸
      </p>
    `;

  }


  if (cartCount === 0) {

    items =
      "<p>Корзина пуста</p>";

  }


  document.getElementById(
    "cart-items"
  ).innerHTML = items;


  document.getElementById(
    "cart-total"
  ).textContent =
    `Итого: ${cartTotal} ₸`;

}


function closeCart() {

  document.getElementById(
    "cart-modal"
  ).style.display = "none";

}


// ==============================
// ОФОРМЛЕНИЕ
// ==============================

function openCheckout() {

  if (cartCount === 0) {

    alert("Корзина пуста");

    return;

  }


  document.getElementById(
    "cart-modal"
  ).style.display = "none";


  document.getElementById(
    "checkout-modal"
  ).style.display = "flex";

}


function closeCheckout() {

  document.getElementById(
    "checkout-modal"
  ).style.display = "none";

}


// ==============================
// ОТПРАВКА ЗАКАЗА
// ==============================

function sendOrder() {

  let name =
    document.getElementById(
      "customer-name"
    ).value.trim();


  let phone =
    document.getElementById(
      "customer-phone"
    ).value.trim();


  let address =
    document.getElementById(
      "customer-address"
    ).value.trim();


  let tableNumber =
    document.getElementById(
      "table-number"
    ).value.trim();


  let payment =
    document.querySelector(
      'input[name="payment"]:checked'
    ).value;


  let orderType =
    document.querySelector(
      'input[name="orderType"]:checked'
    ).value;


  // Имя

  if (name === "") {

    alert("Заполните имя");

    return;

  }


  // Стол

  if (
    orderType === "В заведении" &&
    tableNumber === ""
  ) {

    alert("Укажите номер стола");

    return;

  }


  // Доставка

  if (
    orderType === "Доставка" &&
    (phone === "" || address === "")
  ) {

    alert(
      "Заполните номер телефона и адрес"
    );

    return;

  }


  let order = "";


  // Филадельфия

  if (philadelphiaCount > 0) {

    order +=
      `Филадельфия × ${philadelphiaCount} — ${philadelphiaCount * 2790} ₸\n`;

  }


  // Калифорния

  if (californiaCount > 0) {

    order +=
      `Калифорния × ${californiaCount} — ${californiaCount * 2490} ₸\n`;

  }


  // Чизбургер

  if (burgerCount > 0) {

    order +=
      `Чизбургер × ${burgerCount} — ${burgerCount * 1650} ₸\n`;

  }


  // Аляска

  if (alaskaCount > 0) {

    order +=
      `Аляска × ${alaskaCount} — ${alaskaCount * 2390} ₸\n`;

  }


  // Бонито

  if (bonitoCount > 0) {

    order +=
      `Бонито × ${bonitoCount} — ${bonitoCount * 2190} ₸\n`;

  }


  // Bubble Tea 0.5

  if (bubble05Count > 0) {

    order +=
      `Bubble Tea 0.5 л × ${bubble05Count} — ${bubble05Count * 1300} ₸\n`;

  }


  // Bubble Tea 0.7

  if (bubble07Count > 0) {

    order +=
      `Bubble Tea 0.7 л × ${bubble07Count} — ${bubble07Count * 1500} ₸\n`;

  }


  // Лимонад 0.5

  if (lemonade05Count > 0) {

    order +=
      `Лимонад 0.5 л × ${lemonade05Count} — ${lemonade05Count * 700} ₸\n`;

  }


  // Лимонад 0.7

  if (lemonade07Count > 0) {

    order +=
      `Лимонад 0.7 л × ${lemonade07Count} — ${lemonade07Count * 900} ₸\n`;

  }


  let customerInfo = "";


  if (orderType === "В заведении") {

    customerInfo =
`Тип заказа: В заведении
Имя: ${name}
Стол: ${tableNumber}`;

  } else {

    customerInfo =
`Тип заказа: Доставка
Имя: ${name}
Телефон: ${phone}
Адрес: ${address}`;

  }


  let message =
`Новый заказ 🍔

${order}
Итого: ${cartTotal} ₸

${customerInfo}

Оплата: ${payment}`;


  let whatsappNumber =
    "77781577796";


  let whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


  window.open(
    whatsappURL,
    "_blank"
  );


  showSuccess();

}


// ==============================
// ЗАКАЗ ПРИНЯТ
// ==============================

function showSuccess() {

  document.getElementById(
    "checkout-modal"
  ).style.display = "none";


  document.getElementById(
    "success-modal"
  ).style.display = "flex";


  document.getElementById(
    "success-total"
  ).textContent =
    `Итого: ${cartTotal} ₸`;

}


// ==============================
// НА ГЛАВНУЮ — БАРЛЫҒЫН RESET
// ==============================

function closeSuccess() {

  document.getElementById(
    "success-modal"
  ).style.display = "none";


  // Барлық товар 0

  philadelphiaCount = 0;
  californiaCount = 0;
  burgerCount = 0;

  alaskaCount = 0;
  bonitoCount = 0;

  bubble05Count = 0;
  bubble07Count = 0;

  lemonade05Count = 0;
  lemonade07Count = 0;


  // Корзина 0

  cartCount = 0;
  cartTotal = 0;


  // Экрандағы сандарды да 0 қыламыз

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


  // Форманы тазалау

  document.getElementById(
    "customer-name"
  ).value = "";


  document.getElementById(
    "customer-phone"
  ).value = "";


  document.getElementById(
    "customer-address"
  ).value = "";


  document.getElementById(
    "table-number"
  ).value = "";


  // Басты бетке апару

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ==============================
// САЙТ ЖҮКТЕЛГЕНДЕ
// ==============================

document.addEventListener(
  "DOMContentLoaded",
  function() {


    // 0 болғанда − пен сан көрінбейді

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


    // ==============================
    // KASPI
    // ==============================

    document
      .querySelectorAll(
        'input[name="payment"]'
      )
      .forEach(function(radio) {

        radio.addEventListener(
          "change",
          function() {

            let kaspiPayment =
              document.getElementById(
                "kaspi-payment"
              );


            if (
              this.value ===
              "Kaspi перевод"
            ) {

              kaspiPayment.style.display =
                "block";

            } else {

              kaspiPayment.style.display =
                "none";

            }

          }
        );

      });


    // ==============================
    // В ЗАВЕДЕНИИ / ДОСТАВКА
    // ==============================

    let orderTypeRadios =
      document.querySelectorAll(
        'input[name="orderType"]'
      );


    let tableField =
      document.getElementById(
        "table-field"
      );


    let phoneField =
      document.getElementById(
        "customer-phone"
      );


    let addressField =
      document.getElementById(
        "customer-address"
      );


    function updateOrderFields() {

      let selectedType =
        document.querySelector(
          'input[name="orderType"]:checked'
        ).value;


      if (
        selectedType ===
        "В заведении"
      ) {

        tableField.style.display =
          "block";

        phoneField.style.display =
          "none";

        addressField.style.display =
          "none";

      } else {

        tableField.style.display =
          "none";

        phoneField.style.display =
          "block";

        addressField.style.display =
          "block";

      }

    }


    orderTypeRadios.forEach(
      function(radio) {

        radio.addEventListener(
          "change",
          updateOrderFields
        );

      }
    );


    updateOrderFields();

  }
);