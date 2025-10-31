// practice6_dynamic_fields.js
// 動態新增報名欄位 + 匯出功能 + localStorage 暫存 + 錯誤提示樣式

const form = document.getElementById('dynamic-form');
const list = document.getElementById('participant-list');
const addBtn = document.getElementById('add-participant');
const submitBtn = document.getElementById('submit-btn');
const resetBtn = document.getElementById('reset-btn');
const countLabel = document.getElementById('count');

const maxParticipants = 5;
let participantIndex = 0;


function createParticipantCard(data = {}) {
  const index = participantIndex++;
  const wrapper = document.createElement('div');
  wrapper.className = 'participant card border-0 shadow-sm';
  wrapper.dataset.index = index;
  wrapper.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <h5 class="card-title mb-0">參與者 ${index + 1}</h5>
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove">移除</button>
      </div>
      <div class="mb-3">
        <label class="form-label" for="name-${index}">姓名</label>
        <input id="name-${index}" class="form-control" type="text" required
               value="${data.name || ''}" aria-describedby="name-${index}-error">
        <p id="name-${index}-error" class="text-danger small mb-0" aria-live="polite"></p>
      </div>
      <div class="mb-0">
        <label class="form-label" for="email-${index}">Email</label>
        <input id="email-${index}" class="form-control" type="email" required
               value="${data.email || ''}" aria-describedby="email-${index}-error" inputmode="email">
        <p id="email-${index}-error" class="text-danger small mb-0" aria-live="polite"></p>
      </div>
    </div>
  `;
  return wrapper;
}

function updateCount() {
  countLabel.textContent = list.children.length;
  addBtn.disabled = list.children.length >= maxParticipants;
  saveToLocalStorage();
}


function setError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  input.setCustomValidity(message);
  error.textContent = message;
  input.classList.toggle('is-invalid', !!message);
}


function validateInput(input) {
  const value = input.value.trim();
  if (!value) {
    setError(input, '此欄位必填');
    return false;
  }
  if (input.type === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      setError(input, 'Email 格式不正確');
      return false;
    }
  }
  setError(input, '');
  return true;
}

function exportParticipants(asText = false) {
  const data = Array.from(list.querySelectorAll('.participant')).map((p) => ({
    name: p.querySelector('[type="text"]').value.trim(),
    email: p.querySelector('[type="email"]').value.trim(),
  }));

  if (data.length === 0) {
    alert('目前沒有參與者資料');
    return;
  }

  const textData = asText
    ? data.map((d, i) => `${i + 1}. ${d.name} - ${d.email}`).join('\n')
    : JSON.stringify(data, null, 2);

  const blob = new Blob([textData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = asText ? 'participants.txt' : 'participants.json';
  a.click();
  URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
  const data = Array.from(list.querySelectorAll('.participant')).map((p) => ({
    name: p.querySelector('[type="text"]').value.trim(),
    email: p.querySelector('[type="email"]').value.trim(),
  }));
  localStorage.setItem('participants', JSON.stringify(data));
}

function restoreFromLocalStorage() {
  const stored = localStorage.getItem('participants');
  if (!stored) return;
  const data = JSON.parse(stored);
  data.forEach((item) => list.appendChild(createParticipantCard(item)));
  updateCount();
}


function handleAddParticipant() {
  if (list.children.length >= maxParticipants) return;
  const participant = createParticipantCard();
  list.appendChild(participant);
  updateCount();
  participant.querySelector('input').focus();
}


addBtn.addEventListener('click', handleAddParticipant);

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="remove"]');
  if (!button) return;
  button.closest('.participant')?.remove();
  updateCount();
});

list.addEventListener('blur', (event) => {
  if (event.target.matches('input')) validateInput(event.target);
}, true);

list.addEventListener('input', (event) => {
  if (event.target.matches('input')) {
    validateInput(event.target);
    saveToLocalStorage();
  }
});


form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (list.children.length === 0) {
    alert('請至少新增一位參與者');
    handleAddParticipant();
    return;
  }

  let firstInvalid = null;
  list.querySelectorAll('input').forEach((input) => {
    const valid = validateInput(input);
    if (!valid && !firstInvalid) firstInvalid = input;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '送出中';
  await new Promise((r) => setTimeout(r, 1000));

  alert('表單已送出');
  form.reset();
  list.innerHTML = '';
  participantIndex = 0;
  updateCount();
  localStorage.removeItem('participants');

  submitBtn.disabled = false;
  submitBtn.textContent = '送出';
});

resetBtn.addEventListener('click', () => {
  form.reset();
  list.innerHTML = '';
  participantIndex = 0;
  updateCount();
  localStorage.removeItem('participants');
});

const exportJSONBtn = document.createElement('button');
exportJSONBtn.textContent = '匯出 JSON';
exportJSONBtn.className = 'btn btn-outline-success ms-2';
exportJSONBtn.type = 'button';
form.querySelector('.d-flex').appendChild(exportJSONBtn);

const exportTextBtn = document.createElement('button');
exportTextBtn.textContent = '匯出文字';
exportTextBtn.className = 'btn btn-outline-warning';
exportTextBtn.type = 'button';
form.querySelector('.d-flex').appendChild(exportTextBtn);

exportJSONBtn.addEventListener('click', () => exportParticipants(false));
exportTextBtn.addEventListener('click', () => exportParticipants(true));

restoreFromLocalStorage();
if (list.children.length === 0) handleAddParticipant();
