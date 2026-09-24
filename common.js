const API_BASE_URL = 'http://localhost:8080';

// Простая проверка формата email на клиенте.
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  if (password.length < 8) return 'Пароль должен быть не короче 8 символов';
  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  return null;
}

function showError(boxEl, message) {
  boxEl.textContent = message;
  boxEl.style.display = message ? 'block' : 'none';
}

// Общая обёртка над fetch для запросов к нашему auth API.
// Кидает объект { status, data } — вызывающий код сам решает,
// что делать с кодом ответа.
async function apiRequest(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}