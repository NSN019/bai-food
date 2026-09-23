const SUPABASE_URL = "https://elzjmbwkgleuzpybiqdg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsemptYndrZ2xldXpweWJpcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDA1OTEsImV4cCI6MjEwNDA3NjU5MX0.JtcrSCdtV20YrMIyqYI66SjywOgGa4CVRqFRdpCujLg";

let currentFilter="waiting",selectedOrderId=null,selectedAcceptOrderId=null,selectedRejectOrderId=null,orders=[];
let accessToken=typeof localStorage!=="undefined"?localStorage.getItem("baiFoodAdminAccessToken"):null;
let refreshTimer=null,alarmTimer=null,audioContext=null,soundEnabled=false,soundPlaying=false,activeSoundNodes=[];
let selectedDate=getLocalDateKey(new Date());

function getLocalDateKey(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
function orderDateKey(value){return getLocalDateKey(new Date(value))}
function formatSelectedDate(key){const[y,m,d]=key.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}
function updateDateUI(){document.getElementById("order-date").value=selectedDate;document.getElementById("selected-date-label").textContent=formatSelectedDate(selectedDate)}
function changeDate(days){const[y,m,d]=selectedDate.split("-").map(Number),date=new Date(y,m-1,d);date.setDate(date.getDate()+days);selectedDate=getLocalDateKey(date);updateDateUI();renderOrders()}
function selectDate(value){if(!value)return;selectedDate=value;updateDateUI();renderOrders()}
function goToday(){selectedDate=getLocalDateKey(new Date());updateDateUI();renderOrders()}

async function loginAdmin(){
  const email=prompt("Введите email кассира:");if(!email)return false;
  const password=prompt("Введите пароль:");if(!password)return false;
  try{const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY},body:JSON.stringify({email,password})});if(!response.ok){alert("Email или пароль неверный.");return false}const data=await response.json();accessToken=data.access_token;localStorage.setItem("baiFoodAdminAccessToken",accessToken);return true}catch(error){console.error(error);alert("Не удалось подключиться к серверу.");return false}
}

function normalizeOrder(order){
  const rawItems=Array.isArray(order.items)?order.items:[];
  const deliveryItem=rawItems.find(item=>item.is_delivery||String(item.name||"").startsWith("Доставка —"));
  const items=rawItems.filter(item=>item!==deliveryItem);
  const itemSubtotal=order.items_subtotal!=null?Number(order.items_subtotal):items.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.quantity)||0),0);
  const deliveryFee=order.delivery_fee!=null?Number(order.delivery_fee):(Number(deliveryItem?.price)||Math.max(0,(Number(order.total)||0)-itemSubtotal));
  let deliveryZone=order.delivery_zone||deliveryItem?.zone||"";
  let address=order.address||"";
  const legacyMatch=address.match(/^\[([^\]]+)\]\s*/);if(!deliveryZone&&legacyMatch){deliveryZone=legacyMatch[1];address=address.replace(legacyMatch[0],"")}
  if(deliveryZone==="Ауыл / Бактыбай")deliveryZone="Бақтыбай";
  return{id:order.id,table:order.table_number||"—",customer:order.customer_name||"Без имени",phone:order.phone||"",address,orderType:order.order_type,items,itemSubtotal,deliveryZone,deliveryFee,total:Number(order.total)||0,payment:order.payment_method||"cash",paymentStatus:order.payment_status==="paid"?"paid":"waiting",orderStatus:order.order_status||"waiting_payment",acceptedAt:order.accepted_at||null,cancelledAt:order.cancelled_at||null,cancellationReason:order.cancellation_reason||null,cancellationComment:order.cancellation_comment||null,prepMinutes:Number(order.prep_minutes)||null,cashChangeMode:order.cash_change_mode||null,cashChangeFrom:order.cash_change_from==null?null:Number(order.cash_change_from),createdAt:order.created_at,time:formatTime(order.created_at)}
}
const ACTIVE_WAITING_STATUSES=new Set(["waiting_payment","waiting","new","pending"]);
function isNewOrder(order){return Boolean(order&&!order.acceptedAt&&!order.cancelledAt&&ACTIVE_WAITING_STATUSES.has(order.orderStatus))}
function cancellationReasonLabel(reason){return({stop_list:"Позиция в стоп-листе",no_ingredients:"Нет ингредиентов",unreachable:"Не удалось связаться с клиентом",other:"Другая причина"})[reason]||"Причина не указана"}

async function loadOrders(){
  if(!accessToken){const ok=await loginAdmin();if(!ok)return}
  try{const response=await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=200`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${accessToken}`}});
    if(response.status===401){localStorage.removeItem("baiFoodAdminAccessToken");accessToken=null;const ok=await loginAdmin();if(ok)return loadOrders();return}
    if(!response.ok)throw new Error(await response.text());
    orders=(await response.json()).map(normalizeOrder);renderOrders();syncAlarm();
  }catch(error){console.error(error);showToastMessage("Не удалось загрузить заказы",true)}
}
function getOrdersForSelectedDate(){return orders.filter(order=>orderDateKey(order.createdAt)===selectedDate)}

function renderOrders(){
  const container=document.getElementById("orders"),empty=document.getElementById("empty-state");container.innerHTML="";
  const dayOrders=getOrdersForSelectedDate();const filtered=dayOrders.filter(order=>currentFilter==="all"||(currentFilter==="cancelled"?order.orderStatus==="cancelled":order.paymentStatus===currentFilter&&order.orderStatus!=="cancelled"));empty.style.display=filtered.length?"none":"block";
  filtered.forEach(order=>{
    const isKaspi=order.payment==="kaspi",isDelivery=order.orderType==="delivery",isAccepted=Boolean(order.acceptedAt),isCancelled=order.orderStatus==="cancelled"||Boolean(order.cancelledAt),isNew=isNewOrder(order);
    const card=document.createElement("article");card.className=`order-card ${order.paymentStatus}${isNew?" is-new":""}${isCancelled?" is-cancelled":""}`;card.dataset.orderId=order.id;
    const itemsHTML=order.items.map(item=>`<div class="order-item${item.is_gift?" gift":""}"><span>${escapeHTML(item.name)} × ${Number(item.quantity)||0}</span><strong>${formatMoney((Number(item.price)||0)*(Number(item.quantity)||0))}</strong></div>`).join("");
    const paymentStatus=order.paymentStatus==="paid"?"✓ Оплачено":isKaspi?"⏳ Проверить Kaspi":isDelivery?"🚚 Оплата курьеру":"⏳ Ожидает оплаты";
    const location=isDelivery?`🚚 ${escapeHTML(order.deliveryZone||"Зона не указана")} · ${escapeHTML(order.address||"Адрес не указан")}`:`🪑 Стол №${escapeHTML(order.table)}`;
    let actions="";
    if(isNew)actions+=`<div class="new-order-actions"><button class="accept-order-button" onclick="openAcceptModal(${order.id})">ПРИНЯТЬ ЗАКАЗ</button><button class="reject-order-button" onclick="openRejectModal(${order.id})">ОТКЛОНИТЬ ЗАКАЗ</button></div>`;
    if(isAccepted&&!isCancelled&&order.paymentStatus!=="paid")actions+=`<button class="pay-button ${isKaspi?"kaspi-button":""}" onclick="openConfirmModal(${order.id})">${isKaspi?"💳 ПРОВЕРИТЬ KASPI И ПОДТВЕРДИТЬ":"💵 ПОДТВЕРДИТЬ ОПЛАТУ"}</button>`;
    if(!isCancelled&&order.paymentStatus==="paid")actions+=`<div class="paid-button">✓ Оплата подтверждена</div>`;
    const deliveryHTML=isDelivery?`<div class="delivery-breakdown"><div><span>Товары</span><strong>${formatMoney(order.itemSubtotal)}</strong></div><div><span>Доставка</span><strong>${order.deliveryFee===0?"Бесплатно":formatMoney(order.deliveryFee)}</strong></div><div><span>Итого</span><strong>${formatMoney(order.total)}</strong></div></div>`:"";
    const prepHTML=isAccepted&&order.prepMinutes?`<div class="prep-info">⏱️ Примерное время: <strong>${order.prepMinutes} минут</strong></div>`:"";
    const changeHTML=order.payment==="cash"?(order.cashChangeMode==="change"&&order.cashChangeFrom!=null?`<div class="change-info"><span>Нужна сдача с</span><strong>${formatMoney(order.cashChangeFrom)}</strong><span>Сдача</span><strong>${formatMoney(Math.max(0,order.cashChangeFrom-order.total))}</strong></div>`:`<div class="change-info no-change">💵 Без сдачи</div>`):"";
    const cancellationHTML=isCancelled?`<div class="cancellation-info"><strong>Отклонён:</strong> ${escapeHTML(cancellationReasonLabel(order.cancellationReason))}${order.cancellationComment?`<br><span>${escapeHTML(order.cancellationComment)}</span>`:""}</div>`:"";
    const acceptanceText=isCancelled?"ОТКЛОНЁН":isAccepted?"ПРИНЯТ":"🔴 НОВЫЙ ЗАКАЗ",acceptanceClass=isCancelled?"cancelled":isAccepted?"accepted":"new";
    card.innerHTML=`<div class="order-header"><div><h3 class="order-number">Заказ №${order.id}</h3><span class="order-time">${order.time}</span></div><div><span class="acceptance-badge ${acceptanceClass}">${acceptanceText}</span><span class="status-badge ${order.paymentStatus}">${paymentStatus}</span></div></div>
      <div class="order-body"><div class="customer-row"><span class="info-pill">${location}</span><span class="info-pill">👤 ${escapeHTML(order.customer)}</span><span class="info-pill payment-pill ${isKaspi?"kaspi":""}">${isKaspi?"💳 Kaspi перевод":"💵 Наличные"}</span>${order.phone?`<span class="info-pill">📞 ${escapeHTML(order.phone)}</span>`:""}</div>${cancellationHTML}${prepHTML}${changeHTML}<div class="order-items">${itemsHTML}</div>${deliveryHTML}<div class="order-total"><span>Итого</span><strong>${formatMoney(order.total)}</strong></div><div class="action-stack">${actions}</div></div>`;
    container.appendChild(card);
  });updateStats();
}
function setFilter(filter,button){currentFilter=filter;document.querySelectorAll(".tab").forEach(tab=>tab.classList.remove("active"));button.classList.add("active");renderOrders()}
function showNewOrders(){currentFilter="waiting";document.querySelectorAll(".tab").forEach(tab=>tab.classList.toggle("active",tab.textContent.includes("Ожидают")));selectedDate=getLocalDateKey(new Date());updateDateUI();renderOrders();document.getElementById("orders").scrollIntoView({behavior:"smooth"})}

async function patchOrder(orderId,changes){const response=await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,{method:"PATCH",headers:{"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${accessToken}`,Prefer:"return=minimal"},body:JSON.stringify(changes)});if(!response.ok)throw new Error(await response.text())}
async function postAdminRpc(name,body){const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${accessToken}`},body:JSON.stringify(body)});if(!response.ok)throw new Error(await response.text());return response}
function openAcceptModal(orderId){const order=orders.find(item=>String(item.id)===String(orderId));if(!isNewOrder(order))return;selectedAcceptOrderId=orderId;document.getElementById("accept-order-label").textContent=`Заказ №${orderId}: выберите время`;document.getElementById("accept-modal").style.display="flex"}
function closeAcceptModal(){document.getElementById("accept-modal").style.display="none";selectedAcceptOrderId=null}
async function confirmAcceptOrder(prepMinutes){if(![20,30,40].includes(Number(prepMinutes))||selectedAcceptOrderId==null)return;const orderId=selectedAcceptOrderId,order=orders.find(item=>String(item.id)===String(orderId));if(!isNewOrder(order)){closeAcceptModal();return}document.querySelectorAll(".prep-time-options button").forEach(button=>button.disabled=true);try{const acceptedAt=new Date().toISOString();await patchOrder(orderId,{accepted_at:acceptedAt,prep_minutes:Number(prepMinutes)});order.acceptedAt=acceptedAt;order.prepMinutes=Number(prepMinutes);closeAcceptModal();syncAlarm();await loadOrders();showToastMessage(`✓ Заказ принят · ${prepMinutes} минут`)}catch(error){console.error(error);showToastMessage("Не удалось принять. Проверьте SQL patch.",true)}finally{document.querySelectorAll(".prep-time-options button").forEach(button=>button.disabled=false)}}

function openRejectModal(orderId){const order=orders.find(item=>String(item.id)===String(orderId));if(!isNewOrder(order))return;selectedRejectOrderId=orderId;document.getElementById("reject-order-label").textContent=`Заказ №${orderId}: выберите причину. Заказ останется в истории.`;document.querySelector('input[name="rejection-reason"][value="stop_list"]').checked=true;document.getElementById("rejection-comment").value="";document.getElementById("rejection-comment").hidden=true;document.getElementById("reject-modal").style.display="flex"}
function closeRejectModal(){document.getElementById("reject-modal").style.display="none";selectedRejectOrderId=null}
function toggleRejectionComment(){const selected=document.querySelector('input[name="rejection-reason"]:checked');document.getElementById("rejection-comment").hidden=selected?.value!=="other"}
async function confirmRejectOrder(){if(selectedRejectOrderId==null)return;const orderId=selectedRejectOrderId,order=orders.find(item=>String(item.id)===String(orderId));if(!isNewOrder(order)){closeRejectModal();return}const reason=document.querySelector('input[name="rejection-reason"]:checked')?.value,comment=document.getElementById("rejection-comment").value.trim(),button=document.getElementById("confirm-reject-button");button.disabled=true;try{await postAdminRpc("cancel_order_v2",{p_order_id:Number(orderId),p_reason:reason,p_comment:comment||null});order.orderStatus="cancelled";order.cancelledAt=new Date().toISOString();order.cancellationReason=reason;order.cancellationComment=reason==="other"?comment:null;closeRejectModal();syncAlarm();renderOrders();await loadOrders();showToastMessage("Заказ отклонён")}catch(error){console.error(error);showToastMessage("Не удалось отклонить заказ",true)}finally{button.disabled=false}}

function openConfirmModal(orderId){selectedOrderId=orderId;const order=orders.find(item=>String(item.id)===String(orderId));if(!order)return;const kaspi=order.payment==="kaspi",delivery=order.orderType==="delivery";document.getElementById("confirm-icon").textContent=kaspi?"💳":"💵";document.getElementById("confirm-title").textContent=kaspi?"Подтвердить Kaspi?":delivery?"Курьер получил оплату?":"Подтвердить оплату?";document.getElementById("confirm-payment-button").textContent=kaspi?"✓ Kaspi проверен":"✓ Оплачено";document.getElementById("confirm-text").textContent=`Заказ №${order.id} · ${formatMoney(order.total)}. Принятие и оплата сохраняются отдельно.`;document.getElementById("confirm-modal").style.display="flex"}
function closeConfirmModal(){document.getElementById("confirm-modal").style.display="none";selectedOrderId=null}
async function confirmPayment(){if(selectedOrderId==null)return;const id=selectedOrderId,order=orders.find(item=>String(item.id)===String(id));try{await patchOrder(id,{payment_status:"paid",order_status:"paid",paid_at:new Date().toISOString(),...(order.acceptedAt?{}:{accepted_at:new Date().toISOString()})});closeConfirmModal();await loadOrders();showToastMessage("✓ Оплата подтверждена")}catch(error){console.error(error);alert("Не удалось изменить статус оплаты.")}}

function updateStats(){const day=getOrdersForSelectedDate(),waiting=day.filter(o=>o.paymentStatus==="waiting"&&o.orderStatus!=="cancelled"),paid=day.filter(o=>o.paymentStatus==="paid"&&o.orderStatus!=="cancelled");document.getElementById("orders-count").textContent=day.length;document.getElementById("waiting-count").textContent=waiting.length;document.getElementById("paid-count").textContent=paid.length;document.getElementById("revenue").textContent=formatMoney(paid.reduce((sum,o)=>sum+o.total,0))}
function formatTime(value){return new Date(value).toLocaleTimeString("ru-RU",{timeZone:"Asia/Almaty",hour:"2-digit",minute:"2-digit"})}
function formatMoney(amount){return `${new Intl.NumberFormat("ru-RU").format(amount)} ₸`}
function escapeHTML(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function showToastMessage(message,isError=false){const toast=document.getElementById("toast");toast.textContent=message;toast.style.borderColor=isError?"#71332f":"#265d34";toast.style.background=isError?"#3a1715":"#15341e";toast.style.color=isError?"#ffaaa4":"#77e493";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2600)}

function getAlmatyDateKey(date=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Almaty",year:"numeric",month:"2-digit",day:"2-digit"}).format(date)}
function unacceptedOrders(){const today=getAlmatyDateKey();return orders.filter(order=>isNewOrder(order)&&getAlmatyDateKey(new Date(order.createdAt))===today)}
function stopOrderSignal(){activeSoundNodes.forEach(node=>{try{node.stop()}catch{}});activeSoundNodes=[];soundPlaying=false}
function syncAlarm(){const pending=unacceptedOrders(),alertBox=document.getElementById("new-order-alert");alertBox.hidden=pending.length===0;document.getElementById("new-order-alert-title").textContent=pending.length===1?`🔴 НОВЫЙ ЗАКАЗ №${pending[0].id}`:`🔴 НОВЫХ ЗАКАЗОВ: ${pending.length}`;if(!pending.length){clearInterval(alarmTimer);alarmTimer=null;stopOrderSignal();return}if(soundEnabled&&!alarmTimer){playOrderSignal();alarmTimer=setInterval(playOrderSignal,3000)}}
async function enableOrderSound(){try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();await audioContext.resume();soundEnabled=true;const button=document.getElementById("sound-button");button.classList.add("enabled");button.textContent="🔔 Звук заказов включён";playOrderSignal();syncAlarm()}catch(error){console.error(error);showToastMessage("Браузер не разрешил звук",true)}}
function playOrderSignal(){if(!soundEnabled||!unacceptedOrders().length||!audioContext||soundPlaying)return;const now=audioContext.currentTime,master=audioContext.createGain();master.gain.setValueAtTime(.65,now);master.connect(audioContext.destination);const notes=[{t:0,f:783.99,d:.48},{t:.18,f:1046.5,d:.62},{t:.64,f:1318.51,d:.7}];soundPlaying=true;activeSoundNodes=[];notes.forEach(note=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(note.f,now+note.t);gain.gain.setValueAtTime(.0001,now+note.t);gain.gain.exponentialRampToValueAtTime(.2,now+note.t+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+note.t+note.d);oscillator.connect(gain).connect(master);oscillator.start(now+note.t);oscillator.stop(now+note.t+note.d+.03);activeSoundNodes.push(oscillator)});setTimeout(()=>{activeSoundNodes=[];soundPlaying=false},1500)}

function startAutoRefresh(){if(refreshTimer)clearInterval(refreshTimer);refreshTimer=setInterval(loadOrders,5000)}
async function startAdmin(){updateDateUI();await loadOrders();startAutoRefresh()}
if(typeof document!=="undefined"){
  document.getElementById("confirm-modal").addEventListener("click",function(event){if(event.target===this)closeConfirmModal()});
  document.getElementById("accept-modal").addEventListener("click",function(event){if(event.target===this)closeAcceptModal()});
  document.getElementById("reject-modal").addEventListener("click",function(event){if(event.target===this)closeRejectModal()});
  document.querySelectorAll('input[name="rejection-reason"]').forEach(input=>input.addEventListener("change",toggleRejectionComment));
  document.querySelector(".refresh-button").addEventListener("click",loadOrders);
  startAdmin();
  window.BAI_FOOD_ADMIN_TEST={normalizeOrder,isNewOrder,unacceptedOrders,stopOrderSignal,setOrders:value=>{orders=value.map(normalizeOrder);renderOrders();syncAlarm()}};
}
if(typeof module!=="undefined")module.exports={normalizeOrder,isNewOrder,setOrdersForTest:value=>{orders=value.map(normalizeOrder)},unacceptedOrders,getAlmatyDateKey};
