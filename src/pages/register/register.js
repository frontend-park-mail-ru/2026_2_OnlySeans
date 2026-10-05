import { createButton } from '../../components/ui/button/button.js';
import { createCard } from '../../components/ui/card/card.js';
import { createErrorBox } from '../../components/ui/error-box/error-box.js';
import { createSwitchLink } from '../../components/ui/switch-link/switch-link.js';
import { validateEmail, validateUsername, validatePassword, showError } from '../../modules/validation.js';
import { apiRequest } from '../../api/auth.js';
import { createField, setFieldError, getFieldValue } from '../../components/ui/field/field.js';
import { eventBus, EVENTS } from '../../modules/event-bus.js';
import { createSiteLogo } from '../../components/ui/site-logo/site-logo.js';

export class RegisterPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }

  render() {
    document.title = 'Регистрация';

    const card = createCard({ title: 'Регистрация' });
    card.prepend(createSiteLogo({ className: 'site-logo--auth' }));
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
    card.appendChild(createSwitchLink({ text: 'Уже есть аккаунт?', linkText: 'Войти', href: '/login' }));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      showError(errorBox, '');
      [emailField, usernameField, passwordField].forEach((field) => setFieldError(field, ''));

      const email = getFieldValue(emailField);
      const username = getFieldValue(usernameField);
      const password = getFieldValue(passwordField);
      let hasError = false;

      if (!email || !validateEmail(email)) {
        setFieldError(emailField, 'Введите корректный email');
        hasError = true;
      }
      const usernameError = validateUsername(username);
      if (usernameError) {
        setFieldError(usernameField, usernameError);
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
        const { ok, status, data } = await apiRequest('/api/register', {
          method: 'POST',
          body: { email, username, password },
        });

        if (!ok) {
          const message = status === 409
            ? 'Пользователь с таким email уже существует'
            : data.error || 'Не удалось зарегистрироваться';
          showError(errorBox, message);
          return;
        }

        eventBus.emit(EVENTS.AUTH_REGISTER, data.user);
        this.navigate('/login');

      } catch {
        showError(errorBox, 'Не удалось связаться с сервером. Он точно запущен?');
      } finally {
        submitBtn.disabled = false;
      }
    });

    return card;
  }
}
