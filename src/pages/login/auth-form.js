import { authPath, getAuthReturnPath } from '../../services/auth-return.js';
import { createAuthLayout } from './auth-layout.js';
import { addPasswordToggle } from './password-toggle.js';
import { setupLiveValidation } from './live-validation.js';
import { createButton } from '../../components/ui/button/button.js';
import { createErrorBox } from '../../components/ui/error-box/error-box.js';
import { createSwitchLink } from '../../components/ui/switch-link/switch-link.js';
import { createField, getFieldValue } from '../../components/ui/field/field.js';
import { limitTextInput } from '../../utils/text-limit.js';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  showError,
} from '../../modules/validation.js';
import { apiRequest } from '../../api/auth.js';
import { store } from '../../modules/store.js';
import { element } from '../../utils/dom.js';

const copy = {
  login: {
    title: 'С возвращением!',
    subtitle: 'Продолжим с того кадра, на котором остановились.',
    button: 'Войти',
  },
  register: {
    title: 'Добро пожаловать!',
    subtitle: 'Ваши любимые фильмы — в одном кадре.',
    button: 'Зарегистрироваться',
  },
};

export const createAuthPage = ({ mode: initialMode, navigate }) => {
  let mode = initialMode;
  let modeVersion = 0;
  const { page, card } = createAuthLayout({ mode, ...copy[mode] });
  const errorBox = createErrorBox('errorBox');
  errorBox.setAttribute('role', 'alert');
  const form = element('form');
  form.noValidate = true;
  const emailField = createField({ id: 'email', label: 'Email', type: 'email' });
  const usernameField = createField({ id: 'username', label: 'Имя пользователя' });
  const passwordField = createField({ id: 'password', label: 'Пароль', type: 'password' });
  emailField.querySelector('input').autocomplete = 'email';
  // Лимиты длины как на сервере: лишние символы просто не вводятся.
  limitTextInput(emailField.querySelector('input'), 254);
  limitTextInput(usernameField.querySelector('input'), 32);
  limitTextInput(passwordField.querySelector('input'), 32);
  const usernameInput = usernameField.querySelector('input');
  usernameInput.autocomplete = 'username';
  const passwordInput = addPasswordToggle(passwordField, 'current-password');
  const usernameSlot = element('div', 'auth-username-slot');
  const usernameClip = element('div');
  usernameClip.append(usernameField);
  usernameSlot.append(usernameClip);
  const submitButton = createButton({ text: copy[mode].button, type: 'submit' });
  form.append(emailField, usernameSlot, passwordField, submitButton);
  const switchSlot = element('div');
  card.append(errorBox, form, switchSlot);
  const validation = setupLiveValidation(
    form,
    submitButton,
    [
      {
        field: emailField,
        check: (value) => (validateEmail(value) ? '' : 'Введите корректный email'),
      },
      { field: usernameField, check: validateUsername, when: () => mode === 'register' },
      {
        field: passwordField,
        check: (value) => {
          if (mode === 'register') return validatePassword(value);
          return value ? '' : 'Введите пароль';
        },
      },
    ],
    () => showError(errorBox, ''),
  );

  // меняется только режим и поле имени, поля почты и пароля остаются на месте
  page.setAuthMode = (nextMode) => {
    modeVersion++;
    mode = nextMode;
    const registering = mode === 'register';
    document.title = registering ? 'Регистрация' : 'Вход';
    card.querySelector('h1').textContent = copy[mode].title;
    card.querySelector('.login-panel__subtitle').textContent = copy[mode].subtitle;
    const tabs = page.querySelector('.login-tabs');
    tabs.dataset.active = mode;
    for (const link of tabs.querySelectorAll('a')) {
      const linkMode = new URL(link.href).pathname.slice(1);
      link.href = authPath(linkMode);
      if (linkMode === mode) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    form.id = registering ? 'registerForm' : 'loginForm';
    usernameInput.disabled = !registering;
    usernameSlot.inert = !registering;
    usernameSlot.setAttribute('aria-hidden', String(!registering));
    usernameSlot.classList.toggle('auth-username-slot--visible', registering);
    passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
    submitButton.textContent = copy[mode].button;
    switchSlot.replaceChildren(
      createSwitchLink(
        registering
          ? { text: 'Уже есть аккаунт?', linkText: 'Войти', href: authPath('login') }
          : { text: 'Нет аккаунта?', linkText: 'Зарегистрироваться', href: authPath('register') },
      ),
    );
    showError(errorBox, '');
    validation.validate();
  };
  page.setAuthMode(mode);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (validation.isSubmitting() || !validation.validate(true)) return;
    const submittedVersion = modeVersion;
    const registering = mode === 'register';
    const email = getFieldValue(emailField);
    const password = passwordInput.value;
    const body = registering
      ? { email, username: getFieldValue(usernameField), password }
      : { email, password };
    showError(errorBox, '');
    validation.setSubmitting(true);
    try {
      const { ok, status, data } = await apiRequest(registering ? '/api/register' : '/api/login', {
        method: 'POST',
        body,
      });
      if (!page.isConnected || modeVersion !== submittedVersion) return;
      if (!ok) {
        const message =
          registering && status === 409
            ? 'Пользователь с таким email уже существует'
            : data.error || (registering ? 'Не удалось зарегистрироваться' : 'Не удалось войти');
        showError(errorBox, message);
        return;
      }
      store.setState({ user: data.user });
      if (!page.isConnected || modeVersion !== submittedVersion) return;
      navigate(getAuthReturnPath() || '/discover', { replace: true });
    } catch {
      if (page.isConnected && modeVersion === submittedVersion)
        showError(errorBox, 'Не удалось связаться с сервером. Он точно запущен?');
    } finally {
      validation.setSubmitting(false);
    }
  });
  return page;
};
