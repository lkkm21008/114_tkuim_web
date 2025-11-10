const form = document.querySelector("#plantForm");
const list = document.querySelector("#plantList");
const clearBtn = document.querySelector("#clearAll");
const themeToggle = document.querySelector("#themeToggle"); // 深色模式按鈕

// ---------- 初始化 ----------
window.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadPlants();
});

// ---------- 載入植物資料 ----------
function loadPlants() {
  const data = JSON.parse(localStorage.getItem("plants")) || [];
  list.innerHTML = "";
  data.forEach(p => renderPlant(p));
}

// ---------- 載入主題 ----------
function loadTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.body.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "☀️ 切換亮色模式" : "🌙 切換深色模式";
}

// ---------- 切換主題 ----------
themeToggle.addEventListener("click", () => {
  const current = document.body.dataset.theme;
  const newTheme = current === "dark" ? "light" : "dark";
  document.body.dataset.theme = newTheme;
  localStorage.setItem("theme", newTheme);
  themeToggle.textContent = newTheme === "dark" ? "☀️ 切換亮色模式" : "🌙 切換深色模式";
});

// ---------- 新增植物 ----------
form.addEventListener("submit", e => {
  e.preventDefault();
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  const name = document.querySelector("#plantName").value.trim();
  const date = document.querySelector("#waterDate").value;
  const photoInput = document.querySelector("#plantPhoto");

  let imgSrc = "https://via.placeholder.com/400x200?text=我的植物";
  if (photoInput.files && photoInput.files[0]) {
    imgSrc = URL.createObjectURL(photoInput.files[0]);
  }

  const plant = { id: Date.now(), name, date, imgSrc };
  renderPlant(plant);
  savePlant(plant);

  form.reset();
  form.classList.remove("was-validated");
});

// ---------- 產生卡片 ----------
function renderPlant(plant) {
  const col = document.createElement("div");
  col.classList.add("col-md-4");
  col.dataset.id = plant.id;

  const card = document.createElement("div");
  card.classList.add("card", "p-3", "plant-card", "shadow-sm");

  const today = new Date();
  const lastWater = new Date(plant.date);
  const days = Math.floor((today - lastWater) / (1000 * 60 * 60 * 24));

  let warningText = "";
  if (days > 7) {
    warningText = `<p class="water-warning">🚨 已經 ${days} 天沒澆水了！</p>`;
  } else {
    warningText = `<p>距離上次澆水：${days} 天</p>`;
  }

  card.innerHTML = `
    <button class="delete-btn" title="刪除紀錄">×</button>
    <img src="${plant.imgSrc}" class="plant-photo mb-2">
    <h5>${plant.name}</h5>
    <p class="water-date">上次澆水日期：${plant.date}</p>
    <div class="water-status">${warningText}</div>
    <button class="btn btn-success water-btn mt-2">💧 澆水</button>
  `;

  col.appendChild(card);
  list.prepend(col);
}

// ---------- 儲存資料 ----------
function savePlant(plant) {
  const data = JSON.parse(localStorage.getItem("plants")) || [];
  data.push(plant);
  localStorage.setItem("plants", JSON.stringify(data));
}

// ---------- 更新資料 ----------
function updatePlant(id, newDate) {
  const data = JSON.parse(localStorage.getItem("plants")) || [];
  const index = data.findIndex(p => p.id === id);
  if (index !== -1) {
    data[index].date = newDate;
    localStorage.setItem("plants", JSON.stringify(data));
  }
}

// ---------- 刪除單筆 / 澆水 ----------
list.addEventListener("click", e => {
  // 刪除
  if (e.target.classList.contains("delete-btn")) {
    const card = e.target.closest(".col-md-4");
    const id = Number(card.dataset.id);
    card.remove();
    removePlant(id);
  }

  // 澆水
  if (e.target.classList.contains("water-btn")) {
    const card = e.target.closest(".col-md-4");
    const id = Number(card.dataset.id);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const waterDate = card.querySelector(".water-date");
    const waterStatus = card.querySelector(".water-status");

    waterDate.textContent = `上次澆水日期：${todayStr}`;
    waterStatus.innerHTML = `<p>距離上次澆水：0 天</p>`;
    updatePlant(id, todayStr);

    alert("✅ 已更新澆水日期！");
  }
});

// ---------- 移除單筆 ----------
function removePlant(id) {
  const data = JSON.parse(localStorage.getItem("plants")) || [];
  const newData = data.filter(p => p.id !== id);
  localStorage.setItem("plants", JSON.stringify(newData));
}

// ---------- 一鍵清除 ----------
clearBtn.addEventListener("click", () => {
  if (list.children.length === 0) {
    alert("目前沒有任何紀錄可刪除。");
    return;
  }
  if (confirm("確定要刪除所有植物紀錄嗎？")) {
    list.innerHTML = "";
    localStorage.removeItem("plants");
  }
});
