import { createCard, createErrorBox, createButton, createSwitchLink } from '../components/components.js';
import { validateEmail, validatePassword, showError } from '../services/validation.js';
import { apiRequest } from '../api/auth.js';
import { applyTheme, getPreferredTheme } from '../services/theme.js';
import { createField, setFieldError, getFieldValue } from '../utils/field-helpers.js';

applyTheme(getPreferredTheme());

const app = document.getElementById('app');

// --- Собираем карточку из компонентов (components.js + field-helpers.js) ---
const card = createCard({ title: 'Регистрация' });

const errorBox = createErrorBox('errorBox');
card.appendChild(errorBox);

const form = document.createElement('form');
form.id = 'registerForm';
form.noValidate = true;

const emailField = createField({ id: 'email', label: 'Email', type: 'email' });
const usernameField = createField({ id: 'username', label: 'Имя пользователя' });
const passwordField = createField({ id: 'password', label: 'Пароль', type: 'password' });
const submitBtn = createButton({ text: 'Зарегистрироваться', type: 'submit' });

form.append(emailField, usernameField, passwordField, submitBtn);
card.appendChild(form);
card.appendChild(createSwitchLink({ text: 'Уже есть аккаунт?', linkText: 'Войти', href: 'login.html' }));

app.appendChild(card);

// --- Логика отправки формы (та же, что была, но работает через хелперы полей) ---
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError(errorBox, '');
  [emailField, usernameField, passwordField].forEach((f) => setFieldError(f, ''));

  const email = getFieldValue(emailField);
  const username = getFieldValue(usernameField);
  const password = getFieldValue(passwordField);

  let hasError = false;

  if (!email || !validateEmail(email)) {
    setFieldError(emailField, 'Введите корректный email');
    hasError = true;
  }
  if (username.length < 3) {
    setFieldError(usernameField, 'Минимум 3 символа');
    hasError = true;
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    setFieldError(passwordField, passwordError);
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled = true;
  try {
    const { ok, data } = await apiRequest('/api/register', {
      method: 'POST',
      body: { email, username, password },
    });

    if (!ok) {
      showError(errorBox, data.error || 'Не удалось зарегистрироваться');
      return;
    }

    console.log('Зарегистрирован пользователь:', data.user);
    alert('Регистрация прошла успешно! Теперь можно войти.');
    window.location.href = 'login.html';
  } catch (err) {
    showError(errorBox, 'Не удалось связаться с сервером. Он точно запущен?');
  } finally {
    submitBtn.disabled = false;
  }
});
