const $ = (sel) => document.querySelector(sel);

const statusEl = $("#status");
const btnReload = $("#btnReload");

const views = {
  events: $("#view-events"),
  participants: $("#view-participants"),
  registrations: $("#view-registrations"),
};

function setStatus(msg) {
  statusEl.textContent = msg;
}

function switchView(name) {
  document.querySelectorAll(".nav").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  Object.entries(views).forEach(([k, el]) => {
    el.classList.toggle("hidden", k !== name);
  });
}

document.querySelectorAll(".nav").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

btnReload.addEventListener("click", async () => {
  await reloadAll();
});

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === "string" ? data : (data.error || "API error"));
  return data;
}

// -------- EVENTS --------
const formEvent = $("#formEvent");
const tableEventsBody = $("#tableEvents tbody");

async function loadEvents() {
  const events = await api("/api/events");
  tableEventsBody.innerHTML = events.map(e => `
    <tr>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${escapeHtml(e.title)}</td>
      <td>${escapeHtml(e.location)}</td>
      <td>${e.quota ?? ""}</td>
      <td>
        <button class="btn danger" data-del-event="${e._id}">刪除</button>
      </td>
    </tr>
  `).join("");

  // 填下拉選單
  fillEventSelects(events);
}

formEvent.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fd = new FormData(formEvent);
  const payload = Object.fromEntries(fd.entries());
  payload.quota = Number(payload.quota);

  setStatus("新增活動中...");
  await api("/api/events", { method: "POST", body: JSON.stringify(payload) });
  formEvent.reset();
  await loadEvents();
  setStatus("已新增活動");
});

tableEventsBody.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("[data-del-event]");
  if (!btn) return;
  const id = btn.dataset.delEvent;
  if (!confirm("確定刪除此活動？")) return;

  setStatus("刪除活動中...");
  await api(`/api/events/${id}`, { method: "DELETE" });
  await loadEvents();
  setStatus("已刪除活動");
});

// -------- PARTICIPANTS --------
const formParticipant = $("#formParticipant");
const tableParticipantsBody = $("#tableParticipants tbody");

async function loadParticipants() {
  const list = await api("/api/participants");
  tableParticipantsBody.innerHTML = list.map(p => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.email || "")}</td>
      <td>${escapeHtml(p.phone || "")}</td>
      <td>
        <button class="btn danger" data-del-part="${p._id}">刪除</button>
      </td>
    </tr>
  `).join("");

  fillParticipantSelects(list);
}

formParticipant.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fd = new FormData(formParticipant);
  const payload = Object.fromEntries(fd.entries());

  setStatus("新增參與者中...");
  await api("/api/participants", { method: "POST", body: JSON.stringify(payload) });
  formParticipant.reset();
  await loadParticipants();
  setStatus("已新增參與者");
});

tableParticipantsBody.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("[data-del-part]");
  if (!btn) return;
  const id = btn.dataset.delPart;
  if (!confirm("確定刪除此參與者？")) return;

  setStatus("刪除參與者中...");
  await api(`/api/participants/${id}`, { method: "DELETE" });
  await loadParticipants();
  setStatus("已刪除參與者");
});

// -------- REGISTRATIONS --------
const selEvent = $("#selEvent");
const selParticipant = $("#selParticipant");
const formRegister = $("#formRegister");

const selRosterEvent = $("#selRosterEvent");
const btnLoadRoster = $("#btnLoadRoster");
const tableRosterBody = $("#tableRoster tbody");

let cachedEvents = [];
let cachedParticipants = [];

function fillEventSelects(events) {
  cachedEvents = events;
  const options = events.map(e => `<option value="${e._id}">${escapeHtml(e.title)}</option>`).join("");
  selEvent.innerHTML = options || `<option value="">（無活動）</option>`;
  selRosterEvent.innerHTML = options || `<option value="">（無活動）</option>`;
}

function fillParticipantSelects(list) {
  cachedParticipants = list;
  const options = list.map(p => `<option value="${p._id}">${escapeHtml(p.name)} (${escapeHtml(p.email||"")})</option>`).join("");
  selParticipant.innerHTML = options || `<option value="">（無參與者）</option>`;
}

formRegister.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const eventId = selEvent.value;
  const participantId = selParticipant.value;
  if (!eventId || !participantId) return;

  setStatus("送出報名中...");
  try {
    await api("/api/registrations", {
      method: "POST",
      body: JSON.stringify({ eventId, participantId }),
    });
    setStatus("報名成功");
  } catch (e) {
    setStatus("報名失敗（可能重複報名）");
    alert(e.message);
  }
});

btnLoadRoster.addEventListener("click", async () => {
  await loadRoster();
});

async function loadRoster() {
  const eventId = selRosterEvent.value;
  if (!eventId) return;

  setStatus("載入名單中...");
  const list = await api(`/api/events/${eventId}/registrations`);

  tableRosterBody.innerHTML = list.map(r => `
    <tr>
      <td>${escapeHtml(r.participant?.name || "")}</td>
      <td>${escapeHtml(r.participant?.email || "")}</td>
      <td>${escapeHtml(r.participant?.phone || "")}</td>
      <td>
        ${r.checkedIn
          ? `<span class="badge ok">已簽到</span>`
          : `<span class="badge no">未簽到</span>`}
      </td>
      <td>
        <button class="btn" data-checkin="${r._id}" ${r.checkedIn ? "disabled" : ""}>簽到</button>
        <button class="btn danger" data-cancel="${r._id}">取消</button>
      </td>
    </tr>
  `).join("");

  setStatus("名單已載入");
}

tableRosterBody.addEventListener("click", async (ev) => {
  const checkBtn = ev.target.closest("[data-checkin]");
  const cancelBtn = ev.target.closest("[data-cancel]");

  if (checkBtn) {
    const id = checkBtn.dataset.checkin;
    setStatus("簽到中...");
    await api(`/api/registrations/${id}/checkin`, { method: "PATCH" });
    await loadRoster();
    setStatus("簽到完成");
  }

  if (cancelBtn) {
    const id = cancelBtn.dataset.cancel;
    if (!confirm("確定取消報名？")) return;
    setStatus("取消報名中...");
    await api(`/api/registrations/${id}`, { method: "DELETE" });
    await loadRoster();
    setStatus("已取消報名");
  }
});

// -------- helpers --------
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function reloadAll() {
  try {
    setStatus("載入中...");
    await loadEvents();
    await loadParticipants();
    // 預設載入第一個活動名單（若有）
    if (selRosterEvent.value) await loadRoster();
    setStatus("就緒");
  } catch (e) {
    setStatus("載入失敗");
    console.error(e);
    alert(e.message);
  }
}

reloadAll();
