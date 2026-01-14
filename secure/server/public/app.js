// ===== Config =====
const API = {
  events: "/api/events",
  participants: "/api/participants",
  registrations: "/api/registrations",
  eventRegistrations: (eventId) => `/api/events/${eventId}/registrations`,
  checkin: (regId) => `/api/registrations/${regId}/checkin`,
  cancelReg: (regId) => `/api/registrations/${regId}`,
};

// ===== Auth State =====
let currentUser = null;
let authToken = null;
let mode = "guest";

function checkLogin() {
  authToken = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!authToken || !userStr) {
    if (!window.location.pathname.endsWith("login.html") && !window.location.pathname.endsWith("register.html")) {
      // Redirect to login if not on auth pages
      window.location.href = "./login.html";
    }
    return;
  }

  currentUser = JSON.parse(userStr);
  mode = currentUser.role;
  updateUIByRole();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("my_regs"); // Optional: clear local cache
  localStorage.removeItem("my_regs_detail");
  window.location.href = "./login.html";
}

function updateUIByRole() {
  if (!currentUser) return;

  // Set body dataset for CSS
  document.body.dataset.mode = currentUser.role === "admin" ? "admin" : "user";

  // Update Header User Info
  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay) {
    userDisplay.textContent = `${currentUser.name} (${currentUser.role === "admin" ? "管理者" : "使用者"})`;
  }

  // Update Hint
  const hint = currentUser.role === "admin"
    ? "管理者：可新增/刪除活動、管理參與者、查看名單/簽到與刪除報名"
    : "使用者：可填寫資料報名活動，報名成功會跳出提示窗";

  const hints = document.querySelectorAll(".modeHint"); // Use class instead of IDs
  hints.forEach(h => h.textContent = hint);

  // Default tab
  if (currentUser.role === "user") {
    // User cannot manage participants, hide tab button manually if CSS doesn't catch it all
    // But our CSS depends on body[data-mode='user'] .admin-only { check display:none }
    // So logic remains mostly same
    activateTab("registrations");
  }

  refreshAll();
}

function initModeUI() {
  // Deprecated function kept empty or redirected to checkLogin
  checkLogin();

  // Bind Logout
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
}

// ===== Toast =====
let toastTimer = null;
function showToast(type, msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.classList.remove("hidden", "ok", "err");
  el.classList.add(type === "ok" ? "ok" : "err");
  el.textContent = msg;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

// ===== Helpers =====
async function apiFetch(url, options = {}) {
  // Add Auth Header
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    const t = await res.text().catch(() => "");
    data = { ok: false, error: t || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function el(id) { return document.getElementById(id); }

function fmtDate(s) {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

function safeText(v) {
  return String(v ?? "").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// ===== State =====
let events = [];
let participants = [];
let regs = [];

// ===== Tabs =====
function activateTab(name) {
  const tabs = ["events", "participants", "registrations"];
  for (const t of tabs) {
    const sec = el(`tab-${t}`);
    if (!sec) continue;
    sec.classList.toggle("hidden", t !== name);
  }
  document.querySelectorAll(".nav").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === name);
  });
}

// ===== Render Selects =====
function renderEventSelects() {
  const regEvent = el("regEventSelect");
  const listEvent = el("listEventSelect");
  const adminRegEvent = el("adminRegEventSelect");

  const options = events.map(e =>
    `<option value="${e._id}">${safeText(e.title)}（${safeText(fmtDate(e.date))}）</option>`
  ).join("");

  const defaultOpt = `<option value="">（尚無活動）</option>`;

  if (regEvent) regEvent.innerHTML = options || defaultOpt;
  if (listEvent) listEvent.innerHTML = options || defaultOpt;
  if (adminRegEvent) adminRegEvent.innerHTML = options || defaultOpt;
}

function renderParticipantSelect() {
  const sel = el("regParticipantSelect"); // 可能不存在
  const adminSel = el("adminRegParticipantSelect");

  const options = participants.map(p =>
    `<option value="${p._id}">${safeText(p.name)}（${safeText(p.email)}）</option>`
  ).join("");

  const defaultOpt = `<option value="">（尚無參與者）</option>`;

  if (sel) sel.innerHTML = options || defaultOpt;
  if (adminSel) adminSel.innerHTML = options || defaultOpt;
}

// ===== DOM Helpers =====
function mk(tag, text = "", className = "") {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function clearAndAppend(parent, children) {
  parent.innerHTML = "";
  children.forEach(c => parent.appendChild(c));
}

// ===== Render Tables =====
function renderEventsTable() {
  const tbody = el("eventsTbody");
  const cnt = el("eventsCount");
  if (!tbody) return;

  const myRegs = JSON.parse(localStorage.getItem("my_regs") || "[]");
  const myRegsDetail = JSON.parse(localStorage.getItem("my_regs_detail") || "{}");

  // User Mode: 只顯示已報名的活動
  let displayEvents = events;
  if (mode === "user") {
    displayEvents = events.filter(e => myRegs.includes(e._id));
  }

  if (cnt) cnt.textContent = `共 ${displayEvents.length} 筆`;
  tbody.innerHTML = ""; // Clear existing

  if (displayEvents.length === 0) {
    const tr = mk("tr");
    const td = mk("td", mode === 'user' ? "你尚未報名任何活動。" : "目前沒有活動，請先新增。", "muted");
    td.colSpan = 5;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  displayEvents.forEach(e => {
    const tr = mk("tr");

    // Date
    tr.appendChild(mk("td", fmtDate(e.date)));

    // Title + Badge
    const tdTitle = mk("td");
    tdTitle.appendChild(document.createTextNode(e.title + " "));
    if (myRegs.includes(e._id)) {
      tdTitle.appendChild(mk("span", "已報名", "badge ok"));
    }
    tr.appendChild(tdTitle);

    // Location
    tr.appendChild(mk("td", e.location));

    // Quota
    tr.appendChild(mk("td", String(e.quota)));

    // Actions
    const tdAct = mk("td");

    if (mode === "admin") {
      const delBtn = mk("button", "刪除", "btn danger");
      delBtn.onclick = () => handleDeleteEvent(e._id);
      tdAct.appendChild(delBtn);
    } else if (mode === "user" && myRegs.includes(e._id)) {
      // User Cancel
      const regId = myRegsDetail[e._id];
      if (regId) {
        const cancelBtn = mk("button", "取消報名", "btn danger");
        cancelBtn.onclick = () => handleUserCancelReg(regId, e._id);
        tdAct.appendChild(cancelBtn);
      }
    }

    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
}

// Handlers extracted for clarity
async function handleDeleteEvent(id) {
  if (!confirm("確定刪除這個活動？")) return;
  try {
    await apiFetch(`${API.events}/${id}`, { method: "DELETE" });
    showToast("ok", "已刪除活動");
    await loadEvents();
    await loadEventRegsIfNeeded();
  } catch (e) {
    showToast("err", `刪除失敗：${e.message}`);
  }
}

async function handleUserCancelReg(regId, eventId) {
  if (!confirm("確定要取消報名這個活動嗎？")) return;
  try {
    await apiFetch(API.cancelReg(regId), { method: "DELETE" });
    showToast("ok", "已取消報名");

    // Update LocalStorage
    const myRegs = JSON.parse(localStorage.getItem("my_regs") || "[]");
    const myRegsDetail = JSON.parse(localStorage.getItem("my_regs_detail") || "{}");

    const newMyRegs = myRegs.filter(id => id !== eventId);
    delete myRegsDetail[eventId];

    localStorage.setItem("my_regs", JSON.stringify(newMyRegs));
    localStorage.setItem("my_regs_detail", JSON.stringify(myRegsDetail));

    await loadEvents();
    await loadEventRegsIfNeeded();
  } catch (e) {
    showToast("err", `取消失敗：${e.message}`);
  }
}

function renderParticipantsTable() {
  const tbody = el("participantsTbody");
  const cnt = el("participantsCount");
  if (!tbody) return;

  if (cnt) cnt.textContent = `共 ${participants.length} 筆`;
  tbody.innerHTML = "";

  if (participants.length === 0) {
    const tr = mk("tr");
    const td = mk("td", "目前沒有參與者，請先新增。", "muted");
    td.colSpan = 4;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  participants.forEach(p => {
    const tr = mk("tr");
    tr.appendChild(mk("td", p.name));
    tr.appendChild(mk("td", p.email));
    tr.appendChild(mk("td", p.phone || ""));

    const tdAct = mk("td");
    const delBtn = mk("button", "刪除", "btn danger");
    delBtn.onclick = () => handleDeleteParticipant(p._id);

    tdAct.appendChild(delBtn);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
}

async function handleDeleteParticipant(id) {
  if (!confirm("確定刪除這位參與者？")) return;
  try {
    await apiFetch(`${API.participants}/${id}`, { method: "DELETE" });
    showToast("ok", "已刪除參與者");
    await loadParticipants();
    await loadEventRegsIfNeeded();
  } catch (e) {
    showToast("err", `刪除失敗：${e.message}`);
  }
}

function renderRegsTable() {
  const tbody = el("regsTbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (regs.length === 0) {
    const tr = mk("tr");
    const td = mk("td", "此活動目前沒有報名紀錄。", "muted");
    td.colSpan = 5;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  regs.forEach(r => {
    const tr = mk("tr");
    const p = r.participant || {};
    const checked = !!r.checkedIn;

    tr.appendChild(mk("td", p.name || ""));
    tr.appendChild(mk("td", p.email || ""));
    tr.appendChild(mk("td", p.phone || ""));

    const tdStatus = mk("td");
    const badge = mk("span", checked ? "已簽到" : "未簽到", checked ? "badge ok" : "badge no");
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    const tdAct = mk("td");

    // Checkin Button (Available if not checked in)
    if (!checked) {
      const checkBtn = mk("button", "簽到", "btn");
      checkBtn.onclick = () => handleCheckin(r._id);
      tdAct.appendChild(checkBtn);
      tdAct.appendChild(document.createTextNode(" ")); // space
    }

    // Delete Button (Admin Only)
    if (mode === "admin") {
      const delBtn = mk("button", "刪除報名", "btn danger");
      delBtn.onclick = () => handleDeleteReg(r._id);
      tdAct.appendChild(delBtn);
    }

    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
}

async function handleCheckin(id) {
  try {
    await apiFetch(API.checkin(id), { method: "PATCH" });
    showToast("ok", "已更新簽到狀態");
    await loadEventRegsIfNeeded();
  } catch (e) {
    showToast("err", `操作失敗：${e.message}`);
  }
}

async function handleDeleteReg(id) {
  if (!confirm("確定刪除此筆報名？")) return;
  try {
    await apiFetch(API.cancelReg(id), { method: "DELETE" });
    showToast("ok", "已刪除報名");
    await loadEventRegsIfNeeded();
  } catch (e) {
    showToast("err", `刪除失敗：${e.message}`);
  }
}

// ===== Load data =====
async function checkAPI() {
  const status = el("apiStatus");
  try {
    await apiFetch(API.events, { method: "GET" });
    if (status) status.textContent = "API: 正常";
  } catch (e) {
    if (status) status.textContent = "API: 失敗";
    showToast("err", `API 連線失敗：${e.message}`);
  }
}

async function loadEvents() {
  try {
    const data = await apiFetch(API.events, { method: "GET" });
    events = Array.isArray(data) ? data : (data.events || []);
    renderEventsTable();
    renderEventSelects();
  } catch (e) {
    showToast("err", `載入活動失敗：${e.message}`);
  }
}

async function loadParticipants() {
  try {
    const data = await apiFetch(API.participants, { method: "GET" });
    participants = Array.isArray(data) ? data : (data.participants || []);
    renderParticipantsTable();
    renderParticipantSelect();
  } catch (e) {
    showToast("err", `載入參與者失敗：${e.message}`);
  }
}

async function loadEventRegsIfNeeded() {
  const sel = el("listEventSelect");
  if (!sel || !sel.value) {
    regs = [];
    renderRegsTable();
    return;
  }
  try {
    const data = await apiFetch(API.eventRegistrations(sel.value), { method: "GET" });
    regs = Array.isArray(data) ? data : (data.registrations || []);
    renderRegsTable();
  } catch (e) {
    showToast("err", `載入名單失敗：${e.message}`);
  }
}

async function refreshAll() {
  await checkAPI();
  await loadEvents();
  await loadParticipants();
  await loadEventRegsIfNeeded();
}

// ===== Bind UI =====
// ===== Bind UI =====
function bindNav() {
  document.querySelectorAll(".nav").forEach((b) => {
    b.addEventListener("click", () => {
      const tab = b.dataset.tab;

      // Route Protection Logic
      if (mode === "user") {
        // User forbidden from 'participants' (Admin Management)
        if (tab === "participants") {
          showToast("err", "權限不足：此頁面僅限管理者存取");
          return; // Stop navigation
        }
      }

      if (!authToken) {
        showToast("err", "請先登入");
        window.location.href = "./login.html";
        return;
      }

      activateTab(tab);
    });
  });
}

function bindForms() {
  // 新增活動
  const eventForm = el("eventForm");
  eventForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mode === "user") return showToast("err", "此功能僅限管理者使用");

    const payload = {
      title: el("eventTitle")?.value?.trim(),
      date: el("eventDate")?.value,
      location: el("eventLocation")?.value?.trim(),
      quota: Number(el("eventQuota")?.value || 0),
      description: el("eventDesc")?.value?.trim() || "",
    };

    if (!payload.title || !payload.date || !payload.location || !payload.quota) {
      showToast("err", "請填寫完整活動資訊（名稱/日期/地點/名額）");
      return;
    }

    try {
      await apiFetch(API.events, { method: "POST", body: JSON.stringify(payload) });
      showToast("ok", "新增活動成功");
      eventForm.reset();
      el("eventQuota").value = "30";
      await loadEvents();
    } catch (err) {
      showToast("err", `新增失敗：${err.message}`);
    }
  });

  // 新增參與者（管理者）
  const pForm = el("participantForm");
  pForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mode === "user") return showToast("err", "此功能僅限管理者使用");

    const payload = {
      name: el("pName")?.value?.trim(),
      email: el("pEmail")?.value?.trim(),
      phone: el("pPhone")?.value?.trim() || "",
    };

    if (!payload.name || !payload.email || !payload.phone) {
      showToast("err", "請填寫姓名、Email 與電話");
      return;
    }

    try {
      await apiFetch(API.participants, { method: "POST", body: JSON.stringify(payload) });
      showToast("ok", "新增參與者成功");
      pForm.reset();
      await loadParticipants();
    } catch (err) {
      showToast("err", `新增失敗：${err.message}`);
    }
  });

  // 幫忙報名（管理者）
  const adminRegForm = el("adminRegForm");
  adminRegForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mode === "user") return showToast("err", "此功能僅限管理者使用");

    const eventId = el("adminRegEventSelect")?.value;
    const participantId = el("adminRegParticipantSelect")?.value;

    if (!eventId || !participantId) {
      showToast("err", "請選擇活動與參與者");
      return;
    }

    try {
      await apiFetch(API.registrations, {
        method: "POST",
        body: JSON.stringify({ eventId, participantId }),
      });
      showToast("ok", "幫忙報名成功");

      // Update list if needed
      if (el("listEventSelect").value === eventId) {
        await loadEventRegsIfNeeded();
      } else {
        el("listEventSelect").value = eventId;
        await loadEventRegsIfNeeded();
      }
    } catch (err) {
      if (err.status === 409) {
        showToast("err", "此參與者已報名過該活動");
      } else {
        showToast("err", `報名失敗：${err.message}`);
      }
    }
  });

  // 報名（使用者模式才會看到表單）
  const regForm = el("regForm");
  regForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (mode !== "user") {
      // 管理者看不到這個表單（被 user-only 隱藏），這裡只是保底
      showToast("err", "管理者模式不提供報名操作（僅查看名單/簽到）");
      return;
    }

    const eventId = el("regEventSelect")?.value;
    const name = el("uName")?.value?.trim();
    const email = el("uEmail")?.value?.trim();
    const phone = el("uPhone")?.value?.trim() || "";

    if (!eventId) return showToast("err", "請選擇活動");
    if (!name || !email || !phone) return showToast("err", "請填寫姓名、Email 與電話");

    try {
      // 1) 建立參與者
      const pRes = await apiFetch(API.participants, {
        method: "POST",
        body: JSON.stringify({ name, email, phone }),
      });
      const participantId = pRes?._id || pRes?.participant?._id;
      if (!participantId) throw new Error("建立參與者失敗（未取得 participantId）");

      // 2) 建立報名
      const result = await apiFetch(API.registrations, {
        method: "POST",
        body: JSON.stringify({ eventId, participantId }),
      });

      // ✅ 你要的：跳出提示窗
      alert("報名成功！我們已收到你的報名資料。");

      // Update LocalStorage
      const myRegs = JSON.parse(localStorage.getItem("my_regs") || "[]");
      const myRegsDetail = JSON.parse(localStorage.getItem("my_regs_detail") || "{}");

      if (!myRegs.includes(eventId)) {
        myRegs.push(eventId);
        localStorage.setItem("my_regs", JSON.stringify(myRegs));
      }

      const regId = result.registration._id;
      myRegsDetail[eventId] = regId;
      localStorage.setItem("my_regs_detail", JSON.stringify(myRegsDetail));

      // 更新名單
      el("listEventSelect").value = eventId;
      regForm.reset();
      await loadParticipants(); // 讓 admin 下次進去也看得到新參與者
      await loadEventRegsIfNeeded();
      await loadEvents(); // 更新活動列表的狀態 (已報名)
    } catch (err) {
      if (err.status === 409) {
        alert("此參與者已報名過該活動（重複報名）");
      } else {
        alert(`報名失敗：${err.message}`);
      }
    }
  });

  el("reloadEventsBtn")?.addEventListener("click", loadEvents);
  el("reloadParticipantsBtn")?.addEventListener("click", loadParticipants);
  el("refreshListBtn")?.addEventListener("click", loadEventRegsIfNeeded);
  el("listEventSelect")?.addEventListener("change", loadEventRegsIfNeeded);
}

window.addEventListener("DOMContentLoaded", () => {
  bindNav();
  bindForms();
  initModeUI();
});
