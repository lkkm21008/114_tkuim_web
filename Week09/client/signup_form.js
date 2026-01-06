// === 基本設定 ===
const API_URL = "http://localhost:3001/api/signup"; // 若後端 port 改，改這裡

const form = document.getElementById('signup-form');
const fields = ['name', 'email', 'phone', 'password', 'confirm'];
const touched = new Set();


// === 驗證函式 ===
function validateField(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  let message = '';

  if (!input.value.trim()) message = '此欄位為必填。';
  else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value))
    message = '請輸入正確的 Email 格式。';
  else if (id === 'phone' && !/^09\d{8}$/.test(input.value))
    message = '手機格式錯誤（需為 09 開頭 10 碼）。';
  else if (id === 'password') {
    const v = input.value;
    const hasLetter = /[A-Za-z]/.test(v);
    const hasNumber = /\d/.test(v);
    if (v.length < 8 || !hasLetter || !hasNumber)
      message = '密碼需至少 8 碼並包含英數字（可含符號）。';
  } else if (id === 'confirm') {
    if (input.value !== document.getElementById('password').value)
      message = '兩次密碼不一致。';
  }

  input.setCustomValidity(message);
  errorEl.textContent = message;
  input.classList.toggle('is-invalid', !!message);
  saveToLocal();
  return !message;
}


// === 密碼強度 ===
function updateStrength() {
  const pw = document.getElementById('password').value;
  const bar = document.getElementById('strength-bar');
  const text = document.getElementById('strength-text');

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = ['弱', '中', '強', '非常強'];
  const colors = ['danger', 'warning', 'info', 'success'];

  bar.className = `progress-bar bg-${colors[score - 1] || 'secondary'}`;
  bar.style.width = `${(score / 4) * 100}%`;
  text.textContent = score ? `密碼強度：${levels[score - 1]}` : '請至少包含英文字母與數字。';
}


// === 興趣 ===
const interests = document.getElementById('interests');
interests.addEventListener('change', () => {
  const checked = interests.querySelectorAll('input:checked').length;
  document.getElementById('interest-error').textContent =
    checked ? '' : '請至少勾選一項興趣。';
  saveToLocal();
});


// === blur / input 事件 ===
fields.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => {
    touched.add(id);
    validateField(id);
  });
  el.addEventListener('input', () => {
    if (touched.has(id)) validateField(id);
    if (id === 'password') updateStrength();
  });
});


// === localStorage ===
function saveToLocal() {
  const data = {};
  fields.forEach(id => data[id] = document.getElementById(id).value);
  data.interests = Array.from(interests.querySelectorAll('input:checked')).map(i => i.value);
  data.terms = document.getElementById('terms').checked;
  localStorage.setItem('signup_data', JSON.stringify(data));
}

function restoreFromLocal() {
  const saved = localStorage.getItem('signup_data');
  if (!saved) return;

  const data = JSON.parse(saved);

  fields.forEach(id => {
    if (data[id]) document.getElementById(id).value = data[id];
  });

  if (data.interests) {
    data.interests.forEach(v => {
      const chk = document.querySelector(`input[value="${v}"]`);
      if (chk) chk.checked = true;
    });
  }

  document.getElementById('terms').checked = !!data.terms;
  updateStrength();
}


// === Submit（整合 fetch） ===
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  let firstInvalid = null;

  fields.forEach(id => {
    const valid = validateField(id);
    if (!valid && !firstInvalid) firstInvalid = id;
  });

  const checked = interests.querySelectorAll('input:checked').length;
  const terms = document.getElementById('terms');

  document.getElementById('interest-error').textContent =
    checked ? '' : '請至少勾選一項興趣。';
  document.getElementById('terms-error').textContent =
    terms.checked ? '' : '請同意服務條款。';

  if (!checked && !firstInvalid) firstInvalid = 'interests';
  if (!terms.checked && !firstInvalid) firstInvalid = 'terms';

  if (firstInvalid) {
    document.getElementById(firstInvalid)?.focus();
    return;
  }

  // === Loading UI ===
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = '註冊中...';

  // === 準備送出的後端資料 ===
  const payload = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value
  };

  // === 呼叫後端 API ===
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      alert("後端錯誤：" + (result.error || "未知錯誤"));
      btn.disabled = false;
      btn.textContent = "註冊";
      return;
    }

    alert("註冊成功 🎉");

  } catch (err) {
    alert("無法連線到後端，請確認伺服器是否啟動。");
  }

  // === Reset ===
  form.reset();
  localStorage.removeItem('signup_data');
  document.getElementById('strength-bar').style.width = '0%';
  document.getElementById('strength-text').textContent = '請至少包含英文字母與數字。';
  btn.disabled = false;
  btn.textContent = '註冊';
});


// === Reset 按鈕 ===
document.getElementById('reset-btn').addEventListener('click', () => {
  form.reset();
  document.querySelectorAll('.text-danger').forEach(e => e.textContent = '');
  document.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid'));
  document.getElementById('strength-bar').style.width = '0%';
  document.getElementById('strength-text').textContent = '請至少包含英文字母與數字。';
  localStorage.removeItem('signup_data');
});


// === 復原 localStorage ===
restoreFromLocal();
