const app = document.getElementById('app');

const card = createCard({ title: 'Вход' });

const errorBox = createErrorBox('errorBox');
card.appendChild(errorBox);

const form = document.createElement('form');
form.id = 'loginForm';
form.noValidate = true;

const emailField = createField({ id: 'email', label: 'Email', type: 'email' });
const passwordField = createField({ id: 'password', label: 'Пароль', type: 'password' });
const submitBtn = createButton({ text: 'Войти', type: 'submit' });

form.append(emailField, passwordField, submitBtn);
card.appendChild(form);
card.appendChild(createSwitchLink({ text: 'Нет аккаунта?', linkText: 'Зарегистрироваться', href: 'register.html' }));

app.appendChild(card);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError(errorBox, '');
  [emailField, passwordField].forEach((f) => setFieldError(f, ''));

  const email = getFieldValue(emailField);
  const password = getFieldValue(passwordField);

  let hasError = false;

  if (!email || !validateEmail(email)) {
    setFieldError(emailField, 'Введите корректный email');
    hasError = true;
  }
  if (!password) {
    setFieldError(passwordField, 'Введите пароль');
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled = true;
  try {
    const { ok, data } = await apiRequest('/api/login', { email, password });

    if (!ok) {
      showError(errorBox, data.error || 'Не удалось войти');
      return;
    }

    console.log('Вход выполнен:', data.user);
    alert('Вход выполнен!');
  } catch (err) {
    showError(errorBox, 'Не удалось связаться с сервером. Он точно запущен?');
  } finally {
    submitBtn.disabled = false;
  }
});