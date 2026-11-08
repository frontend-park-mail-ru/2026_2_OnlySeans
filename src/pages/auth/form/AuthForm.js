import { Component } from '../../../core/component.js';
import { FormValidator } from '../../../core/form-validator.js';
import { ApiError } from '../../../api/http.js';
import { login, register } from '../../../services/session.js';
import { authPath, getReturnPath } from '../../../services/auth-return.js';
import {
  LIMITS,
  checkEmail,
  checkNewPassword,
  checkPassword,
  checkUsername,
} from '../../../services/validation.js';
import { TextField } from '../../../components/text-field/TextField.js';
import { loadStyles, loadTemplate } from '../../../core/assets.js';

loadStyles(new URL('./auth-form.css', import.meta.url));
const template = await loadTemplate(new URL('./AuthForm.hbs', import.meta.url));

const TEXTS = {
  login: {
    title: 'С возвращением!',
    subtitle: 'Продолжим с того кадра, на котором остановились.',
    button: 'Войти',
    switchText: 'Нет аккаунта?',
    switchLink: 'Зарегистрироваться',
    failed: 'Не удалось войти',
  },
  register: {
    title: 'Добро пожаловать!',
    subtitle: 'Ваши любимые фильмы в одном кадре.',
    button: 'Зарегистрироваться',
    switchText: 'Уже есть аккаунт?',
    switchLink: 'Войти',
    failed: 'Не удалось зарегистрироваться',
  },
};

export class AuthForm extends Component {
  static template = template;

  #sending = false;

  get #registering() {
    return this.props.mode === 'register';
  }

  context() {
    return { registering: this.#registering, ...this.#texts() };
  }

  onRender() {
    this.email = this.insert(
      'email',
      new TextField({
        name: 'email',
        label: 'Email',
        type: 'email',
        autocomplete: 'email',
        maxLength: LIMITS.email,
      }),
    );
    this.username = this.insert(
      'username',
      new TextField({
        name: 'username',
        label: 'Имя пользователя',
        autocomplete: 'username',
        maxLength: LIMITS.username,
      }),
    );
    this.password = this.insert(
      'password',
      new TextField({
        name: 'password',
        label: 'Пароль',
        password: true,
        autocomplete: this.#registering ? 'new-password' : 'current-password',
        maxLength: LIMITS.password,
      }),
    );

    this.validator = new FormValidator([
      { field: this.email, check: checkEmail },
      { field: this.username, check: checkUsername, active: () => this.#registering },
      {
        field: this.password,
        check: (value) => (this.#registering ? checkNewPassword(value) : checkPassword(value)),
      },
    ]);

    [this.email, this.username, this.password].forEach((field) => {
      this.on('input', () => this.#onEdit(field), field.input);
      this.on('blur', () => this.#onEdit(field), field.input);
    });
    this.on('submit', (event) => this.#submit(event), this.find('.auth-form__form'));
    this.#refreshSubmit();
  }

  setMode(mode) {
    if (mode === this.props.mode) return;
    this.props = { ...this.props, mode };
    const texts = this.#texts();
    this.find('.auth-form__title').textContent = texts.title;
    this.find('.auth-form__subtitle').textContent = texts.subtitle;
    this.find('.auth-form__submit').textContent = texts.button;
    this.find('.auth-form__switch-text').textContent = texts.switchText;
    const link = this.find('.auth-form__switch-link');
    link.textContent = texts.switchLink;
    link.href = texts.switchHref;

    const heading = this.find('.auth-form__heading');
    heading.classList.remove('auth-form__heading--changed');
    heading.getBoundingClientRect();
    heading.classList.add('auth-form__heading--changed');

    const username = this.find('.auth-form__username');
    username.dataset.open = String(this.#registering);
    username.inert = !this.#registering;
    this.password.input.autocomplete = this.#registering ? 'new-password' : 'current-password';

    this.#showError('');
    this.#refreshSubmit();
  }

  #texts() {
    const { mode } = this.props;
    return { ...TEXTS[mode], switchHref: authPath(mode === 'login' ? 'register' : 'login') };
  }

  #onEdit(field) {
    this.validator.touch(field);
    this.#showError('');
    this.#refreshSubmit();
  }

  #refreshSubmit() {
    const valid = this.validator.validate();
    const button = this.find('.auth-form__submit');
    button.disabled = !valid || this.#sending;
    button.classList.toggle('auth-form__submit--ready', valid && !this.#sending);
  }

  #showError(message) {
    this.find('.auth-form__error').textContent = message;
  }

  async #submit(event) {
    event.preventDefault();
    if (this.#sending || !this.validator.validate({ showAll: true })) return;
    const registering = this.#registering;
    const data = { email: this.email.value, password: this.password.value };
    if (registering) data.username = this.username.value;

    this.#sending = true;
    this.#refreshSubmit();
    try {
      await (registering ? register(data) : login(data));
      if (this.element) this.props.navigate(getReturnPath() || '/', { replace: true });
    } catch (error) {
      if (!this.element) return;
      this.#showError(this.#errorText(error, registering));
    } finally {
      this.#sending = false;
      if (this.element) this.#refreshSubmit();
    }
  }

  #errorText(error, registering) {
    if (!(error instanceof ApiError)) return 'Не удалось связаться с сервером. Он точно запущен?';
    if (registering && error.status === 409) return 'Пользователь с таким email уже существует';
    if (!registering && error.status === 401) return 'Неверный email или пароль';
    return TEXTS[this.props.mode].failed;
  }
}
