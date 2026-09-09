const SUPABASE_URL =
  "https://elzjmbwkgleuzpybiqdg.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsemptYndrZ2xldXpweWJpcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDA1OTEsImV4cCI6MjEwNDA3NjU5MX0.JtcrSCdtV20YrMIyqYI66SjywOgGa4CVRqFRdpCujLg";


let currentFilter = "waiting";

let selectedOrderId = null;

let orders = [];

let accessToken =
  localStorage.getItem(
    "baiFoodAdminAccessToken"
  );

let refreshTimer = null;


// Бастапқыда бүгінгі күн таңдалады
let selectedDate =
  getLocalDateKey(new Date());


// =================================
// КҮНДІ ДҰРЫС АЛУ
// =================================

function getLocalDateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// =================================
// ЗАКАЗДЫҢ КҮНІ
// =================================

function orderDateKey(dateString) {

  return getLocalDateKey(
    new Date(dateString)
  );

}


// =================================
// КҮНДІ ӘДЕМІ КӨРСЕТУ
// =================================

function formatSelectedDate(dateKey) {

  const [
    year,
    month,
    day
  ] =
    dateKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return date.toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


// =================================
// DATE UI
// =================================

function updateDateUI() {

  const input =
    document.getElementById(
      "order-date"
    );

  const label =
    document.getElementById(
      "selected-date-label"
    );


  if (input) {
    input.value =
      selectedDate;
  }


  if (label) {

    const today =
      getLocalDateKey(
        new Date()
      );

    if (
      selectedDate === today
    ) {

      label.textContent =
        `Сегодня • ${formatSelectedDate(
          selectedDate
        )}`;

    } else {

      label.textContent =
        formatSelectedDate(
          selectedDate
        );

    }

  }

}


// =================================
// ← → КҮН АУЫСТЫРУ
// =================================

function changeDate(days) {

  const [
    year,
    month,
    day
  ] =
    selectedDate
      .split("-")
      .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  date.setDate(
    date.getDate() + days
  );


  selectedDate =
    getLocalDateKey(date);


  updateDateUI();

  renderOrders();

}


// =================================
// КАЛЕНДАРЬДАН КҮН ТАҢДАУ
// =================================

function selectDate(value) {

  if (!value) {
    return;
  }


  selectedDate = value;


  updateDateUI();

  renderOrders();

}


// =================================
// БҮГІНГІ КҮНГЕ ҚАЙТУ
// =================================

function goToday() {

  selectedDate =
    getLocalDateKey(
      new Date()
    );


  updateDateUI();

  renderOrders();

}


// =================================
// КАССИРДІҢ КІРУІ
// =================================

async function loginAdmin() {

  const email =
    prompt(
      "Кассирдің email адресін енгізіңіз:"
    );


  if (!email) {
    return false;
  }


  const password =
    prompt(
      "Құпия сөзді енгізіңіз:"
    );


  if (!password) {
    return false;
  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_ANON_KEY
          },

          body:
            JSON.stringify({
              email: email,
              password: password
            })
        }
      );


    if (!response.ok) {

      console.error(
        "Login error:",
        await response.text()
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


// =================================
// SUPABASE-ТЕН ЗАКАЗДАРДЫ АЛУ
// =================================

async function loadOrders() {

  if (!accessToken) {

    const loggedIn =
      await loginAdmin();


    if (!loggedIn) {
      return;
    }

  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
        {
          headers: {

            "apikey":
              SUPABASE_ANON_KEY,

            "Authorization":
              `Bearer ${accessToken}`

          }
        }
      );


    // Token ескірсе
    if (
      response.status === 401
    ) {

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


      throw new Error(
        errorText
      );
    }


    const data =
      await response.json();


    orders =
      data.map(
        function(order) {

          return {

            id:
              order.id,

            table:
              order.table_number ||
              "—",

            customer:
              order.customer_name ||
              "Без имени",

            phone:
              order.phone ||
              "",

            address:
              order.address ||
              "",

            orderType:
              order.order_type,

            items:
              Array.isArray(
                order.items
              )
                ? order.items
                : [],

            total:
              Number(
                order.total
              ) || 0,

            payment:
              order.payment_method ||
              "cash",

            status:
              order.payment_status ===
              "paid"
                ? "paid"
                : "waiting",

            createdAt:
              order.created_at,

            time:
              formatTime(
                order.created_at
              )

          };

        }
      );


    renderOrders();

  } catch (error) {

    console.error(error);


    alert(
      "Заказдарды жүктеу мүмкін болмады."
    );

  }

}


// =================================
// ТАҢДАЛҒАН КҮННІҢ ЗАКАЗДАРЫ
// =================================

function getOrdersForSelectedDate() {

  return orders.filter(
    function(order) {

      return (
        orderDateKey(
          order.createdAt
        ) ===
        selectedDate
      );

    }
  );

}


// =================================
// ЗАКАЗДАРДЫ ЭКРАНҒА ШЫҒАРУ
// =================================

function renderOrders() {

  const container =
    document.getElementById(
      "orders"
    );


  const empty =
    document.getElementById(
      "empty-state"
    );


  if (
    !container ||
    !empty
  ) {
    return;
  }


  container.innerHTML = "";


  const dayOrders =
    getOrdersForSelectedDate();


  const filteredOrders =
    dayOrders.filter(
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


  empty.style.display =
    filteredOrders.length === 0
      ? "block"
      : "none";


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
            Number(
              item.price
            ) || 0;


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


      const isKaspi =
        order.payment ===
        "kaspi";


      const isDelivery =
        order.orderType ===
        "delivery";


      let statusText = "";

      let actionButton = "";


      // ===========================
      // ТӨЛЕНБЕГЕН
      // ===========================

      if (
        order.status ===
        "waiting"
      ) {

        if (isKaspi) {

          statusText =
            "⏳ Проверить Kaspi";

        } else if (
          isDelivery
        ) {

          statusText =
            "🚚 Оплата курьеру";

        } else {

          statusText =
            "⏳ Ожидает оплаты";

        }


        let buttonText = "";


        if (isKaspi) {

          buttonText =
            "💳 ПОДТВЕРДИТЬ KASPI";

        } else if (
          isDelivery
        ) {

          buttonText =
            "💵 КУРЬЕР ПОЛУЧИЛ ОПЛАТУ";

        } else {

          buttonText =
            "💵 ПОДТВЕРДИТЬ ОПЛАТУ";

        }


        actionButton = `
          <button
            class="
              pay-button
              ${isKaspi
                ? "kaspi-button"
                : ""}
            "
            onclick="
              openConfirmModal(
                ${order.id}
              )
            "
          >
            ${buttonText}
          </button>
        `;

      }


      // ===========================
      // ТӨЛЕНГЕН
      // ===========================

      else {

        statusText =
          "✓ Оплачено";


        let paidText = "";


        if (isKaspi) {

          paidText =
            "✓ Оплачено через Kaspi";

        } else if (
          isDelivery
        ) {

          paidText =
            "✓ Оплачено курьеру";

        } else {

          paidText =
            "✓ Оплачено наличными";

        }


        actionButton = `
          <div class="paid-button">
            ${paidText}
          </div>
        `;

      }


      // ===========================
      // СТОЛ / ДОСТАВКА
      // ===========================

      let locationText = "";


      if (isDelivery) {

        locationText =
          `🚚 ${escapeHTML(
            order.address ||
            "Доставка"
          )}`;

      } else {

        locationText =
          `🪑 Стол №${escapeHTML(
            String(
              order.table
            )
          )}`;

      }


      // ===========================
      // ТӨЛЕМ ТҮРІ
      // ===========================

      let paymentText = "";


      if (isKaspi) {

        paymentText =
          "💳 Kaspi перевод";

      } else if (
        isDelivery
      ) {

        paymentText =
          "💵 Наличными курьеру";

      } else {

        paymentText =
          "💵 Наличными";

      }


      // ===========================
      // ТЕЛЕФОН
      // ===========================

      const phoneHTML =
        isDelivery &&
        order.phone

          ? `
            <span class="info-pill">
              📞 ${escapeHTML(
                order.phone
              )}
            </span>
          `

          : "";


      // ===========================
      // КАРТОЧКА
      // ===========================

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
            class="
              status-badge
              ${order.status}
            "
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


            <span
              class="
                info-pill
                payment-pill
                ${isKaspi
                  ? "kaspi"
                  : ""}
              "
            >
              ${paymentText}
            </span>


            ${phoneHTML}

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


// =================================
// ФИЛЬТР
// =================================

function setFilter(
  filter,
  button
) {

  currentFilter =
    filter;


  document
    .querySelectorAll(
      ".tab"
    )
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


// =================================
// ОПЛАТА MODAL
// =================================

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


  const isKaspi =
    order.payment ===
    "kaspi";


  const isDelivery =
    order.orderType ===
    "delivery";


  const icon =
    document.getElementById(
      "confirm-icon"
    );


  const title =
    document.getElementById(
      "confirm-title"
    );


  const button =
    document.getElementById(
      "confirm-payment-button"
    );


  if (icon) {

    icon.textContent =
      isKaspi
        ? "💳"
        : "💵";

  }


  if (title) {

    if (isKaspi) {

      title.textContent =
        "Подтвердить Kaspi?";

    } else if (
      isDelivery
    ) {

      title.textContent =
        "Курьер получил оплату?";

    } else {

      title.textContent =
        "Подтвердить оплату?";

    }

  }


  if (button) {

    button.textContent =
      isKaspi
        ? "✓ Kaspi проверен"
        : "✓ Оплачено";

  }


  let placeText = "";


  if (isDelivery) {

    placeText =
      "Доставка";

  } else {

    placeText =
      `Стол №${order.table}`;

  }


  let paymentText = "";


  if (isKaspi) {

    paymentText =
      "Kaspi перевод";

  } else if (
    isDelivery
  ) {

    paymentText =
      "Наличными курьеру";

  } else {

    paymentText =
      "Наличными";

  }


  document.getElementById(
    "confirm-text"
  ).textContent =
    `Заказ №${order.id} • ${placeText} • ${paymentText} • ${formatMoney(
      order.total
    )}`;


  document.getElementById(
    "confirm-modal"
  ).style.display =
    "flex";

}


// =================================
// MODAL ЖАБУ
// =================================

function closeConfirmModal() {

  document.getElementById(
    "confirm-modal"
  ).style.display =
    "none";


  selectedOrderId =
    null;

}


// =================================
// ТӨЛЕМДІ РАСТАУ
// =================================

async function confirmPayment() {

  if (
    selectedOrderId ===
    null
  ) {
    return;
  }


  const orderId =
    selectedOrderId;


  try {

    const response =
      await fetch(
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

          body:
            JSON.stringify({

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


// Ескі функциямен де үйлесімді
function confirmCashPayment() {

  return confirmPayment();

}


// =================================
// КҮНДІК СТАТИСТИКА
// =================================

function updateStats() {

  const dayOrders =
    getOrdersForSelectedDate();


  const waiting =
    dayOrders.filter(
      function(order) {

        return (
          order.status ===
          "waiting"
        );

      }
    );


  const paid =
    dayOrders.filter(
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


  document.getElementById(
    "orders-count"
  ).textContent =
    dayOrders.length;


  document.getElementById(
    "waiting-count"
  ).textContent =
    waiting.length;


  document.getElementById(
    "paid-count"
  ).textContent =
    paid.length;


  document.getElementById(
    "revenue"
  ).textContent =
    formatMoney(
      revenue
    );

}


// =================================
// УАҚЫТ
// =================================

function formatTime(
  dateString
) {

  if (!dateString) {
    return "";
  }


  return new Date(
    dateString
  ).toLocaleTimeString(
    "ru-RU",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// =================================
// АҚША
// =================================

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


// =================================
// TEXT ҚАУІПСІЗДІГІ
// =================================

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


// =================================
// TOAST
// =================================

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


// =================================
// MODAL ФОНЫН БАСҚАНДА ЖАБУ
// =================================

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


// =================================
// ОБНОВИТЬ
// =================================

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


// =================================
// ӘР 5 СЕКУНД САЙЫН ЖАҢАРТУ
// =================================

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


// =================================
// СТАРТ
// =================================

async function startAdmin() {

  updateDateUI();

  await loadOrders();

  startAutoRefresh();

}


startAdmin();     