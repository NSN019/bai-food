let cartCount = 0;
let cartTotal = 0;

let philadelphiaCount = 0;

function addToCart() {
  philadelphiaCount = philadelphiaCount + 1;
  cartCount = cartCount + 1;
  cartTotal = cartTotal + 2790;

  document.getElementById("item-count").textContent = philadelphiaCount;

  document.getElementById("cart-info").textContent =
    `${cartCount} товар — ${cartTotal} ₸`;
}

function removeFromCart() {
  if (philadelphiaCount > 0) {
    philadelphiaCount = philadelphiaCount - 1;
    cartCount = cartCount - 1;
    cartTotal = cartTotal - 2790;

    document.getElementById("item-count").textContent = philadelphiaCount;

    document.getElementById("cart-info").textContent =
      `${cartCount} товар — ${cartTotal} ₸`;
  }
}
let californiaCount = 0;

function addCalifornia() {
  californiaCount = californiaCount + 1;
  cartCount = cartCount + 1;
  cartTotal = cartTotal + 2490;

  document.getElementById("california-count").textContent = californiaCount;

  document.getElementById("cart-info").textContent =
    `${cartCount} товар — ${cartTotal} ₸`;
}

function removeCalifornia() {
  if (californiaCount > 0) {
    californiaCount = californiaCount - 1;
    cartCount = cartCount - 1;
    cartTotal = cartTotal - 2490;

    document.getElementById("california-count").textContent = californiaCount;

    document.getElementById("cart-info").textContent =
      `${cartCount} товар — ${cartTotal} ₸`;
  }
}
let burgerCount = 0;

function addBurger() {
  burgerCount = burgerCount + 1;
  cartCount = cartCount + 1;
  cartTotal = cartTotal + 1650;

  document.getElementById("burger-count").textContent = burgerCount;

  document.getElementById("cart-info").textContent =
    `${cartCount} товар — ${cartTotal} ₸`;
}

function removeBurger() {
  if (burgerCount > 0) {
    burgerCount = burgerCount - 1;
    cartCount = cartCount - 1;
    cartTotal = cartTotal - 1650;

    document.getElementById("burger-count").textContent = burgerCount;

    document.getElementById("cart-info").textContent =
      `${cartCount} товар — ${cartTotal} ₸`;
  }
}
function openCart() {
  document.getElementById("cart-modal").style.display = "flex";

  let items = "";

  if (philadelphiaCount > 0) {
    items += `<p>Филадельфия × ${philadelphiaCount} — ${philadelphiaCount * 2790} ₸</p>`;
  }

  if (californiaCount > 0) {
    items += `<p>Калифорния × ${californiaCount} — ${californiaCount * 2490} ₸</p>`;
  }

  if (burgerCount > 0) {
    items += `<p>Чизбургер × ${burgerCount} — ${burgerCount * 1650} ₸</p>`;
  }

  if (cartCount === 0) {
    items = "<p>Корзина пуста</p>";
  }

  document.getElementById("cart-items").innerHTML = items;

  document.getElementById("cart-total").textContent =
    `Итого: ${cartTotal} ₸`;
}
function closeCart() {
  document.getElementById("cart-modal").style.display = "none";
}
function openCheckout() {
  document.getElementById("cart-modal").style.display = "none";
  document.getElementById("checkout-modal").style.display = "flex";
}

function closeCheckout() {
  document.getElementById("checkout-modal").style.display = "none";
}
function sendOrder() {
  let name = document.getElementById("customer-name").value;
  let phone = document.getElementById("customer-phone").value;
  let address = document.getElementById("customer-address").value;
  let tableNumber = document.getElementById("table-number").value;

  let payment =
    document.querySelector('input[name="payment"]:checked').value;

  let orderType =
    document.querySelector('input[name="orderType"]:checked').value;

  if (name === "") {
    alert("Заполните имя");
    return;
  }

  if (orderType === "В заведении" && tableNumber === "") {
    alert("Укажите номер стола");
    return;
  }

  if (orderType === "Доставка" && (phone === "" || address === "")) {
    alert("Заполните номер телефона и адрес");
    return;
  }

  let order = "";

  if (philadelphiaCount > 0) {
    order += `Филадельфия × ${philadelphiaCount} — ${philadelphiaCount * 2790} ₸\n`;
  }

  if (californiaCount > 0) {
    order += `Калифорния × ${californiaCount} — ${californiaCount * 2490} ₸\n`;
  }

  if (burgerCount > 0) {
    order += `Чизбургер × ${burgerCount} — ${burgerCount * 1650} ₸\n`;
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

  let whatsappNumber = "77781577796";

  let whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(whatsappURL, "_blank");
  showSuccess();
}
function showSuccess() {
  document.getElementById("checkout-modal").style.display = "none";
  document.getElementById("success-modal").style.display = "flex";

  document.getElementById("success-total").textContent =
    `Итого: ${cartTotal} ₸`;
}

function closeSuccess() {
  document.getElementById("success-modal").style.display = "none";

  philadelphiaCount = 0;
  californiaCount = 0;
  burgerCount = 0;
  cartCount = 0;
  cartTotal = 0;

  document.getElementById("item-count").textContent = 0;
  document.getElementById("california-count").textContent = 0;
  document.getElementById("burger-count").textContent = 0;

  document.getElementById("cart-info").textContent =
    "0 товар — 0 ₸";
}
document.querySelectorAll('input[name="payment"]').forEach(function(radio) {
  radio.addEventListener("change", function() {
    let kaspiPayment = document.getElementById("kaspi-payment");

    if (this.value === "Kaspi перевод") {
      kaspiPayment.style.display = "block";
    } else {
      kaspiPayment.style.display = "none";
    }
  });
});
document.querySelectorAll('input[name="orderType"]').forEach(function(radio) {
  radio.addEventListener("change", function() {

    let tableField = document.getElementById("table-field");
    let phoneField = document.getElementById("customer-phone");
    let addressField = document.getElementById("customer-address");

    if (this.value === "В заведении") {
      tableField.style.display = "block";
      phoneField.style.display = "none";
      addressField.style.display = "none";
    } else {
      tableField.style.display = "none";
      phoneField.style.display = "block";
      addressField.style.display = "block";
    }

  });
});
document.addEventListener("DOMContentLoaded", function() {

  let orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
  let tableField = document.getElementById("table-field");
  let phoneField = document.getElementById("customer-phone");
  let addressField = document.getElementById("customer-address");

  function updateOrderFields() {
    let selectedType =
      document.querySelector('input[name="orderType"]:checked').value;

    if (selectedType === "В заведении") {
      tableField.style.display = "block";
      phoneField.style.display = "none";
      addressField.style.display = "none";
    } else {
      tableField.style.display = "none";
      phoneField.style.display = "block";
      addressField.style.display = "block";
    }
  }

  orderTypeRadios.forEach(function(radio) {
    radio.addEventListener("change", updateOrderFields);
  });

  updateOrderFields();

});