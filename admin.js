let currentFilter = "waiting";
let selectedOrderId = null;


/*
=================================
DEMO ЗАКАЗДАР

Кейін Supabase қосылған кезде
осы жердің орнына база келеді.
=================================
*/

let orders = JSON.parse(
  localStorage.getItem("baiFoodOrders")
);

if (!orders) {

  orders = [
    {
      id: 27,
      table: 4,
      customer: "Алихан",

      items: [
        {
          name: "Филадельфия",
          quantity: 2,
          price: 2790
        },

        {
          name: "Bubble Tea 0.5",
          quantity: 1,
          price: 1300
        }
      ],

      total: 6880,

      payment: "Наличные",

      status: "waiting",

      time: "12:41"
    },


    {
      id: 26,
      table: 2,
      customer: "Данияр",

      items: [
        {
          name: "Калифорния",
          quantity: 1,
          price: 2490
        },

        {
          name: "Лимонад 0.5",
          quantity: 2,
          price: 700
        }
      ],

      total: 3890,

      payment: "Наличные",

      status: "paid",

      time: "12:34"
    },


    {
      id: 25,
      table: 7,
      customer: "Айдана",

      items: [
        {
          name: "Аляска",
          quantity: 1,
          price: 2390
        },

        {
          name: "Бонито",
          quantity: 1,
          price: 2190
        }
      ],

      total: 4580,

      payment: "Наличные",

      status: "waiting",

      time: "12:28"
    }
  ];

  saveOrders();
}


/*
=================================
САҚТАУ
=================================
*/

function saveOrders() {

  localStorage.setItem(
    "baiFoodOrders",
    JSON.stringify(orders)
  );
}


/*
=================================
ЗАКАЗДАРДЫ КӨРСЕТУ
=================================
*/

function renderOrders() {

  const container =
    document.getElementById("orders");

  const empty =
    document.getElementById("empty-state");


  container.innerHTML = "";


  let filteredOrders =
    orders.filter(function(order) {

      if (currentFilter === "all") {
        return true;
      }

      return order.status === currentFilter;
    });


  if (filteredOrders.length === 0) {

    empty.style.display = "block";

  } else {

    empty.style.display = "none";
  }


  filteredOrders
    .slice()
    .reverse()
    .forEach(function(order) {

      const card =
        document.createElement("article");

      card.className =
        `order-card ${order.status}`;


      let itemsHTML = "";


      order.items.forEach(function(item) {

        itemsHTML += `
          <div class="order-item">

            <span>
              ${item.name}
              × ${item.quantity}
            </span>

            <strong>
              ${formatMoney(
                item.price *
                item.quantity
              )}
            </strong>

          </div>
        `;
      });


      let statusText = "";

      let actionButton = "";


      if (order.status === "waiting") {

        statusText =
          "⏳ Ожидает оплаты";

        actionButton = `
          <button
            class="pay-button"
            onclick="openConfirmModal(${order.id})"
          >
            💵 ПОДТВЕРДИТЬ ОПЛАТУ
          </button>
        `;

      } else {

        statusText =
          "✓ Оплачено";

        actionButton = `
          <div class="paid-button">
            ✓ Оплачено наличными
          </div>
        `;
      }


      card.innerHTML = `

        <div class="order-header">

          <div>

            <h3 class="order-number">
              Заказ №${order.id}
            </h3>

            <span class="order-time">
              ${order.time}
            </span>

          </div>


          <span
            class="status-badge ${order.status}"
          >
            ${statusText}
          </span>

        </div>


        <div class="order-body">

          <div class="customer-row">

            <span class="info-pill">
              🪑 Стол №${order.table}
            </span>

            <span class="info-pill">
              👤 ${order.customer}
            </span>

          </div>


          <div class="order-items">

            ${itemsHTML}

          </div>


          <div class="order-total">

            <span>
              Итого
            </span>

            <strong>
              ${formatMoney(order.total)}
            </strong>

          </div>


          ${actionButton}

        </div>
      `;


      container.appendChild(card);
    });


  updateStats();
}


/*
=================================
ФИЛЬТР
=================================
*/

function setFilter(
  filter,
  button
) {

  currentFilter =
    filter;


  document
    .querySelectorAll(".tab")
    .forEach(function(tab) {

      tab.classList.remove(
        "active"
      );
    });


  button.classList.add(
    "active"
  );


  renderOrders();
}


/*
=================================
ОПЛАТА MODAL
=================================
*/

function openConfirmModal(orderId) {

  selectedOrderId =
    orderId;


  const order =
    orders.find(function(item) {

      return item.id ===
        orderId;
    });


  if (!order) {
    return;
  }


  document
    .getElementById(
      "confirm-text"
    )
    .textContent =
      `Заказ №${order.id} • Стол №${order.table} • ${formatMoney(order.total)}`;


  document
    .getElementById(
      "confirm-modal"
    )
    .style.display =
      "flex";
}


function closeConfirmModal() {

  document
    .getElementById(
      "confirm-modal"
    )
    .style.display =
      "none";


  selectedOrderId =
    null;
}


/*
=================================
НАЛИЧКА ТӨЛЕМІН РАСТАУ
=================================
*/

function confirmCashPayment() {

  if (
    selectedOrderId === null
  ) {
    return;
  }


  const order =
    orders.find(function(item) {

      return item.id ===
        selectedOrderId;
    });


  if (!order) {
    return;
  }


  order.status =
    "paid";

  order.paidAt =
    new Date().toISOString();


  saveOrders();


  closeConfirmModal();


  renderOrders();


  showToast();


  /*
  =================================
  КЕЙІН ОСЫ ЖЕРДЕ:

  1. Supabase-та статус өзгереді
  2. Заказ кухняға жіберіледі
  3. WhatsApp/кухня уведомление келеді

  Төлем расталмайынша
  кухняға жіберілмейді.
  =================================
  */
}


/*
=================================
СТАТИСТИКА
=================================
*/

function updateStats() {

  const waiting =
    orders.filter(function(order) {

      return order.status ===
        "waiting";

    }).length;


  const paid =
    orders.filter(function(order) {

      return order.status ===
        "paid";

    });


  const revenue =
    paid.reduce(
      function(sum, order) {

        return sum +
          order.total;

      },
      0
    );


  document
    .getElementById(
      "waiting-count"
    )
    .textContent =
      waiting;


  document
    .getElementById(
      "paid-count"
    )
    .textContent =
      paid.length;


  document
    .getElementById(
      "revenue"
    )
    .textContent =
      formatMoney(
        revenue
      );
}


/*
=================================
АҚШАНЫ ФОРМАТТАУ
=================================
*/

function formatMoney(amount) {

  return (
    new Intl.NumberFormat(
      "ru-RU"
    ).format(amount) +
    " ₸"
  );
}


/*
=================================
TOAST
=================================
*/

function showToast() {

  const toast =
    document.getElementById(
      "toast"
    );


  toast.classList.add(
    "show"
  );


  setTimeout(
    function() {

      toast.classList.remove(
        "show"
      );

    },
    2200
  );
}


/*
=================================
MODAL СЫРТЫН БАСҚАНДА ЖАБУ
=================================
*/

document
  .getElementById(
    "confirm-modal"
  )
  .addEventListener(
    "click",
    function(event) {

      if (
        event.target === this
      ) {

        closeConfirmModal();
      }
    }
  );


/*
=================================
СТАРТ
=================================
*/

renderOrders();