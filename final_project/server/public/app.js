// ===== Config =====
const API = {
  events: "/api/events",
  participants: "/api/participants",
  registrations: "/api/registrations",
  eventRegistrations: (eventId) => `/api/events/${eventId}/registrations`,
  checkin: (regId) => `/api/registrations/${regId}/checkin`,
  cancelReg: (regId) => `/api/registrations/${regId}`,
};

// ===== Mode (admin/user) =====
const MODE_KEY = "demo_mode";
let mode = localStorage.getItem(MODE_KEY) || "admin";

function setMode(newMode) {
  mode = newMode === "user" ? "user" : "admin";
  localStorage.setItem(MODE_KEY, mode);
  document.body.dataset.mode = mode;

  const hint = mode === "admin"
    ? "管理者：可新增/刪除活動、管理參與者"
    : "使用者：可報名與簽到（不顯示管理功能）";

  const h1 = document.getElementById("modeHint1");
  const h2 = document.getElementById("modeHint2");
  const h3 = document.getElementById("modeHint3");
  if (h1) h1.textContent = hint;
  if (h2) h2.textContent = hint;
  if (h3) h3.textContent = hint;

  // User 模式預設跳到 registrations
  if (mode === "user") activateTab("registrations");
  refreshAll();
}

function initModeUI() {
  document.body.dataset.mode = mode;
  const select = document.getElementById("modeSelect");
  if (select) {
    select.value = mode;
    select.addEventListener("change", (e) => setMode(e.target.value));
  }
  setMode(mode);
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
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2800);
}

// ===== Helpers =====
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // 非 JSON 也要保底
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
  // 若是 YYYY-MM-DD 直接回傳
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
let regs = []; // registrations list for selected event

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
  if (!regEvent || !listEvent) return;

  const options = events.map(e =>
    `<option value="${e._id}">${safeText(e.title)}（${safeText(fmtDate(e.date))}）</option>`
  ).join("");

  regEvent.innerHTML = options || `<option value="">（尚無活動）</option>`;
  listEvent.innerHTML = options || `<option value="">（尚無活動）</option>`;
}

function renderParticipantSelect() {
  const sel = el("regParticipantSelect");
  if (!sel) return;

  const options = participants.map(p =>
    `<option value="${p._id}">${safeText(p.name)}（${safeText(p.email)}）</option>`
  ).join("");

  sel.innerHTML = options || `<option value="">（尚無參與者）</option>`;
}

// ===== Render Tables =====
function renderEventsTable() {
  const tbody = el("eventsTbody");
  const cnt = el("eventsCount");
  if (!tbody) return;

  if (cnt) cnt.textContent = `共 ${events.length} 筆`;

  tbody.innerHTML = events.map(e => {
    return `
      <tr>
        <td>${safeText(fmtDate(e.date))}</td>
        <td>${safeText(e.title)}</td>
        <td>${safeText(e.location)}</td>
        <td>${safeText(e.quota)}</td>
        <td>
          <button class="btn danger" data-act="delEvent" data-id="${e._id}">刪除</button>
        </td>
      </tr>
    `;
  }).join("") || `
    <tr><td colspan="5" class="muted">目前沒有活動，請先新增。</td></tr>
  `;

  // Bind delete
  tbody.querySelectorAll('[data-act="delEvent"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      if (mode === "user") return showToast("err", "此功能僅限管理者使用");
      const id = btn.dataset.id;
      if (!confirm("確定刪除這個活動？")) return;
      try {
        await apiFetch(`${API.events}/${id}`, { method: "DELETE" });
        showToast("ok", "已刪除活動");
        await loadEvents();
        await loadEventRegsIfNeeded();
      } catch (e) {
        showToast("err", `刪除失敗：${e.message}`);
      }
    });
  });
}

function renderParticipantsTable() {
  const tbody = el("participantsTbody");
  const cnt = el("participantsCount");
  if (!tbody) return;

  if (cnt) cnt.textContent = `共 ${participants.length} 筆`;

  tbody.innerHTML = participants.map(p => {
    return `
      <tr>
        <td>${safeText(p.name)}</td>
        <td>${safeText(p.email)}</td>
        <td>${safeText(p.phone || "")}</td>
        <td>
          <button class="btn danger" data-act="delP" data-id="${p._id}">刪除</button>
        </td>
      </tr>
    `;
  }).join("") || `
    <tr><td colspan="4" class="muted">目前沒有參與者，請先新增。</td></tr>
  `;

  tbody.querySelectorAll('[data-act="delP"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      if (mode === "user") return showToast("err", "此功能僅限管理者使用");
      const id = btn.dataset.id;
      if (!confirm("確定刪除這位參與者？")) return;
      try {
        await apiFetch(`${API.participants}/${id}`, { method: "DELETE" });
        showToast("ok", "已刪除參與者");
        await loadParticipants();
        await loadEventRegsIfNeeded();
      } catch (e) {
        showToast("err", `刪除失敗：${e.message}`);
      }
    });
  });
}

function renderRegsTable() {
  const tbody = el("regsTbody");
  if (!tbody) return;

  tbody.innerHTML = regs.map(r => {
    const checked = !!r.checkedIn;
    const badge = checked
      ? `<span class="badge ok">已簽到</span>`
      : `<span class="badge no">未簽到</span>`;

    const p = r.participant || {};
    return `
      <tr>
        <td>${safeText(p.name || "")}</td>
        <td>${safeText(p.email || "")}</td>
        <td>${safeText(p.phone || "")}</td>
        <td>${badge}</td>
        <td>
          <button class="btn" data-act="toggleCheckin" data-id="${r._id}" data-checked="${checked ? "1" : "0"}">
            ${checked ? "取消簽到" : "簽到"}
          </button>
          <button class="btn danger" data-act="cancelReg" data-id="${r._id}">
            取消報名
          </button>
        </td>
      </tr>
    `;
  }).join("") || `
    <tr><td colspan="5" class="muted">此活動目前沒有報名紀錄。</td></tr>
  `;

  // Bind actions
  tbody.querySelectorAll('[data-act="toggleCheckin"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const isChecked = btn.dataset.checked === "1";
      try {
        // 你的後端若只提供「簽到」而沒有「取消簽到」，這裡會需要你後端支援。
        // 先用同一支 PATCH 讓後端自行切換或簽到即可。
        await apiFetch(API.checkin(id), { method: "PATCH" });
        showToast("ok", isChecked ? "已取消簽到" : "已簽到");
        await loadEventRegsIfNeeded();
      } catch (e) {
        showToast("err", `操作失敗：${e.message}`);
      }
    });
  });

  tbody.querySelectorAll('[data-act="cancelReg"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("確定取消報名？")) return;
      try {
        await apiFetch(API.cancelReg(id), { method: "DELETE" });
        showToast("ok", "已取消報名");
        await loadEventRegsIfNeeded();
      } catch (e) {
        showToast("err", `取消失敗：${e.message}`);
      }
    });
  });
}

// ===== Load data =====
async function checkAPI() {
  const status = el("apiStatus");
  try {
    // 用 events GET 當作健康檢查
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
    // 可能回傳 array 或 {ok, events}
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
  // registrations tab 需要 event list 的 select options，載入後再抓名單
  await loadEventRegsIfNeeded();
}

// ===== Bind UI events =====
function bindNav() {
  document.querySelectorAll(".nav").forEach((b) => {
    b.addEventListener("click", () => {
      const tab = b.dataset.tab;
      // user 模式：不讓切到管理 tab
      if (mode === "user" && (tab === "events" || tab === "participants")) {
        showToast("err", "使用者模式僅提供報名與簽到功能");
        activateTab("registrations");
        return;
      }
      activateTab(tab);
    });
  });
}

function bindForms() {
  // Create Event
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

  // Create Participant
  const pForm = el("participantForm");
  pForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mode === "user") return showToast("err", "此功能僅限管理者使用");

    const payload = {
      name: el("pName")?.value?.trim(),
      email: el("pEmail")?.value?.trim(),
      phone: el("pPhone")?.value?.trim() || "",
    };

    if (!payload.name || !payload.email) {
      showToast("err", "請填寫姓名與 Email");
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

  // Registration
  const regForm = el("regForm");
  regForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const eventId = el("regEventSelect")?.value;
    const participantId = el("regParticipantSelect")?.value;

    if (!eventId || !participantId) {
      showToast("err", "請先選擇活動與參與者");
      return;
    }

    try {
      await apiFetch(API.registrations, {
        method: "POST",
        body: JSON.stringify({ eventId, participantId }),
      });
      showToast("ok", "報名成功");
      // 切到該活動名單
      el("listEventSelect").value = eventId;
      await loadEventRegsIfNeeded();
    } catch (err) {
      // 重複報名通常是 409
      if (err.status === 409) {
        showToast("err", "重複報名：此參與者已報名該活動");
      } else {
        showToast("err", `報名失敗：${err.message}`);
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
  initModeUI(); // initModeUI 會呼叫 refreshAll()
});
