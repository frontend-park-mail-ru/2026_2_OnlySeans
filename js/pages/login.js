import { createCard } from '../../components/modern/ui/card/card.js';
import { validateEmail, showError } from '../services/validation.js';
import { apiRequest } from '../api/auth.js';
import { createButton } from '../../components/modern/ui/button/button.js';
import { createErrorBox } from '../../components/modern/ui/error-box/error-box.js';
import { createSwitchLink } from '../../components/modern/ui/switch-link/switch-link.js';
import { createField, setFieldError, getFieldValue } from '../../components/modern/ui/field/field.js';

export class LoginPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }

  render() {
    document.title = 'Вход';

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
    card.appendChild(createSwitchLink({ text: 'Нет аккаунта?', linkText: 'Зарегистрироваться', href: '/register' }));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      showError(errorBox, '');
      [emailField, passwordField].forEach((field) => setFieldError(field, ''));

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
        const { ok, data } = await apiRequest('/api/login', {
          method: 'POST',
          body: { email, password },
        });
        if (!ok) {
          showError(errorBox, data.error || 'Не удалось войти');
          return;
        }

        console.log('Вход выполнен:', data.user);
        alert('Вход выполнен!');
      } catch {
        showError(errorBox, 'Не удалось связаться с сервером. Он точно запущен?');
      } finally {
        submitBtn.disabled = false;
      }
    });

    return card;
  }
}
