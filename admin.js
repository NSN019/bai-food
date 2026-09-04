const SUPABASE_URL = "https://elzjmbwkgleuzpybiqdg.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImVsemptYndrZ2xldXpweWJpcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDA1OTEsImV4cCI6MjEwNDA3NjU5MX0.JtcrSCdtV20YrMIyqYI66SjywOgGa4CVRqFRdpCujLg";


let currentFilter = "waiting";
let selectedOrderId = null;
let orders = [];

let accessToken =
  localStorage.getItem("baiFoodAdminAccessToken");

let refreshTimer = null;


/*
=================================
КАССИРДІҢ КІРУІ
=================================
*/

async function loginAdmin() {

  const email = prompt(
    "Кассирдің email адресін енгізіңіз:"
  );

  if (!email) {
    return false;
  }


  const password = prompt(
    "Құпия сөзді енгізіңіз:"
  );

  if (!password) {
    return false;
  }


  try {

    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY
        },

        body: JSON.stringify({
          email: email,
          password: password
        })
      }
    );


    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Login error:",
        errorText
      );

      alert(
        "Email немесе пароль дұрыс емес."
      );

      return false;
    }


    const data =
      await response.json();


    accessToken =
      data.access_token;


    localStorage.setItem(
      "baiFoodAdminAccessToken",
      accessToken
    );


    return true;

  } catch (error) {

    console.error(error);

    alert(
      "Supabase серверіне қосылу мүмкін болмады."
    );

    return false;
  }
}


/*
=================================
ЗАКАЗДАРДЫ SUPABASE-ТЕН АЛУ
=================================
*/

async function loadOrders() {

  if (!accessToken) {

    const loggedIn =
      await loginAdmin();

    if (!loggedIn) {
      return;
    }
  }


  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization":
            `Bearer ${accessToken}`
        }
      }
    );


    if (response.status === 401) {

      localStorage.removeItem(
        "baiFoodAdminAccessToken"
      );

      accessToken = null;

      const loggedIn =
        await loginAdmin();

      if (loggedIn) {
        return loadOrders();
      }

      return;
    }


    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Supabase orders error:",
        errorText
      );

      throw new Error(errorText);
    }


    const data =
      await response.json();


    orders =
      data.map(function(order) {

        return {

          id: order.id,

          table:
            order.table_number ||
            "—",

          customer:
            order.customer_name ||
            "Без имени",

          phone:
            order.phone || "",

          address:
            order.address || "",

          orderType:
            order.order_type,

          items:
            Array.isArray(order.items)
              ? order.items
              : [],

          total:
            Number(order.total) || 0,

          payment:
            order.payment_method,

          status:
            order.payment_status === "paid"
              ? "paid"
              : "waiting",

          time:
            formatTime(
              order.created_at
            )
        };

      });


    renderOrders();


  } catch (error) {

    console.error(error);

    alert(
      "Заказдарды жүктеу мүмкін болмады."
    );
  }
}


/*
=================================
ЗАКАЗДАРДЫ КӨРСЕТУ
=================================
*/

function renderOrders() {

  const container =
    document.getElementById(
      "orders"
    );

  const empty =
    document.getElementById(
      "empty-state"
    );


  container.innerHTML = "";


  let filteredOrders =
    orders.filter(
      function(order) {

        if (
          currentFilter === "all"
        ) {
          return true;
        }

        return (
          order.status ===
          currentFilter
        );
      }
    );


  if (
    filteredOrders.length === 0
  ) {

    empty.style.display =
      "block";

  } else {

    empty.style.display =
      "none";
  }


  filteredOrders.forEach(
    function(order) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        `order-card ${order.status}`;


      let itemsHTML = "";


      order.items.forEach(
        function(item) {

          const itemPrice =
            Number(item.price) || 0;

          const itemQuantity =
            Number(
              item.quantity
            ) || 0;


          itemsHTML += `
            <div class="order-item">

              <span>
                ${escapeHTML(item.name)}
                × ${itemQuantity}
              </span>

              <strong>
                ${formatMoney(
                  itemPrice *
                  itemQuantity
                )}
              </strong>

            </div>
          `;
        }
      );


      let statusText = "";
      let actionButton = "";


      if (
        order.status ===
        "waiting"
      ) {

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


      let locationText = "";

      if (
        order.orderType ===
        "delivery"
      ) {

        locationText =
          `🚚 ${escapeHTML(
            order.address ||
            "Доставка"
          )}`;

      } else {

        locationText =
          `🪑 Стол №${escapeHTML(
            String(order.table)
          )}`;
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
              ${locationText}
            </span>

            <span class="info-pill">
              👤 ${escapeHTML(
                order.customer
              )}
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
              ${formatMoney(
                order.total
              )}
            </strong>

          </div>


          ${actionButton}

        </div>
      `;


      container.appendChild(
        card
      );
    }
  );


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
    .forEach(
      function(tab) {

        tab.classList.remove(
          "active"
        );
      }
    );


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

function openConfirmModal(
  orderId
) {

  selectedOrderId =
    orderId;


  const order =
    orders.find(
      function(item) {

        return (
          item.id ===
          orderId
        );
      }
    );


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

async function confirmCashPayment() {

  if (
    selectedOrderId === null
  ) {
    return;
  }


  const orderId =
    selectedOrderId;


  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_ANON_KEY,

          "Authorization":
            `Bearer ${accessToken}`,

          "Prefer":
            "return=minimal"
        },

        body: JSON.stringify({
          payment_status:
            "paid",

          order_status:
            "paid",

          paid_at:
            new Date()
              .toISOString()
        })
      }
    );


    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Payment update error:",
        errorText
      );

      throw new Error(
        errorText
      );
    }


    closeConfirmModal();


    await loadOrders();


    showToast();


  } catch (error) {

    console.error(error);

    alert(
      "Төлем статусын өзгерту мүмкін болмады."
    );
  }
}


/*
=================================
СТАТИСТИКА
=================================
*/

function updateStats() {

  const waiting =
    orders.filter(
      function(order) {

        return (
          order.status ===
          "waiting"
        );
      }
    ).length;


  const paid =
    orders.filter(
      function(order) {

        return (
          order.status ===
          "paid"
        );
      }
    );


  const revenue =
    paid.reduce(
      function(
        sum,
        order
      ) {

        return (
          sum +
          order.total
        );
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
УАҚЫТ
=================================
*/

function formatTime(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      dateString
    );


  return date.toLocaleTimeString(
    "ru-RU",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


/*
=================================
АҚША
=================================
*/

function formatMoney(
  amount
) {

  return (
    new Intl.NumberFormat(
      "ru-RU"
    ).format(amount) +
    " ₸"
  );
}


/*
=================================
ҚАУІПСІЗ TEXT
=================================
*/

function escapeHTML(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
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
ОБНОВИТЬ БАТЫРМАСЫ
=================================
*/

const refreshButton =
  document.querySelector(
    ".refresh-button"
  );


if (refreshButton) {

  refreshButton.addEventListener(
    "click",
    function() {

      loadOrders();
    }
  );
}


/*
=================================
АВТОМАТТЫ ОБНОВЛЕНИЕ
=================================
*/

function startAutoRefresh() {

  if (refreshTimer) {

    clearInterval(
      refreshTimer
    );
  }


  refreshTimer =
    setInterval(
      function() {

        loadOrders();

      },
      5000
    );
}


/*
=================================
СТАРТ
=================================
*/

async function startAdmin() {

  await loadOrders();

  startAutoRefresh();
}


startAdmin();