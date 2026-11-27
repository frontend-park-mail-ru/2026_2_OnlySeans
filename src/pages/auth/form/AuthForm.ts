import './auth-form.css';
import templateSource from './AuthForm.hbs';
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
import { loadAssets } from '../../../core/assets.js';
import { HttpStatus } from '../../../api/errors.js';
import type { Navigate } from '../../../app/router.js';
type AuthMode = 'login' | 'register';
interface AuthFormProps {
  mode: AuthMode;
  navigate: Navigate;
  onPendingChange?: (pending: boolean) => void;
  mobileDesign?: boolean;
}

const template = await loadAssets({ template: templateSource });

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

const TEXT_REFS = ['title', 'subtitle', 'button', 'switchText', 'switchLink'] as const;

export class AuthForm extends Component<AuthFormProps> {
  static template = template;
  email!: TextField;
  username!: TextField;
  password!: TextField;
  validator!: FormValidator;

  #sending = false;
  #termsTouched = false;
  #refs: ReturnType<Component['refs']> = {};

  get #registering() {
    return this.props.mode === 'register';
  }

  context() {
    return {
      registering: this.#registering,
      mobileDesign: this.props.mobileDesign,
      ...this.#texts(),
    };
  }

  onRender() {
    this.#refs = this.refs();
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
      this.on('change', () => this.#onEdit(field), field.input);
      this.on('blur', () => this.#onEdit(field), field.input);
    });
    this.on('submit', (event) => this.#submit(event), this.#refs.form);
    this.#refs.username.inert = !this.#registering;
    const terms = this.query<HTMLInputElement>('[name=terms]');
    if (terms)
      this.on(
        'change',
        () => {
          this.#termsTouched = true;
          this.#refreshSubmit();
        },
        terms,
      );
    this.on(
      'resize',
      () => {
        this.#syncCopy();
        this.#refreshSubmit();
      },
      window,
    );
    this.#syncCopy();
    this.#refreshSubmit();
  }

  setMode(mode: AuthMode) {
    if (mode === this.props.mode) return;
    this.props = { ...this.props, mode };
    const texts = this.#texts();
    TEXT_REFS.forEach((name) => {
      this.#refs[name].textContent = texts[name];
    });
    this.#refs.switchLink.setAttribute('href', texts.switchHref);

    const { heading, username } = this.#refs;
    heading.classList.remove('auth-form__heading--changed');
    heading.getBoundingClientRect();
    heading.classList.add('auth-form__heading--changed');

    username.dataset.open = String(this.#registering);
    username.inert = !this.#registering;
    this.password.input.autocomplete = this.#registering ? 'new-password' : 'current-password';

    this.#showError('');
    this.#syncCopy();
    this.#refreshSubmit();
  }

  #texts() {
    const { mode } = this.props;
    return { ...TEXTS[mode], switchHref: authPath(mode === 'login' ? 'register' : 'login') };
  }

  /** Обновляет переход между формами после изменения returnTo в адресе. */
  syncLinks() {
    this.#refs.switchLink.setAttribute('href', this.#texts().switchHref);
  }

  #onEdit(field: TextField) {
    this.validator.touch(field);
    this.#showError('');
    this.#refreshSubmit();
  }

  #refreshSubmit() {
    const valid = this.validator.validate();
    const needsTerms = this.#mobile() && this.#registering;
    const terms = this.query<HTMLInputElement>('[name=terms]');
    const termsValid = !needsTerms || Boolean(terms?.checked);
    const termsError = this.query('[data-terms-error]');
    if (termsError)
      termsError.textContent =
        needsTerms && !termsValid && this.#termsTouched
          ? 'Примите условия сервиса, чтобы создать аккаунт.'
          : '';
    terms?.setAttribute('aria-invalid', String(needsTerms && !termsValid && this.#termsTouched));
    const button = this.#refs.button as HTMLButtonElement;
    button.disabled = !valid || !termsValid || this.#sending;
    button.classList.toggle('auth-form__submit--ready', valid && termsValid && !this.#sending);
  }

  #showError(message: string) {
    this.#refs.error.textContent = message;
  }

  async #submit(event: Event) {
    event.preventDefault();
    if (
      this.#mobile() &&
      this.#registering &&
      !this.query<HTMLInputElement>('[name=terms]')?.checked
    ) {
      this.#termsTouched = true;
      this.#refreshSubmit();
      return;
    }
    if (this.#sending || !this.validator.validate({ showAll: true })) return;
    const registering = this.#registering;
    const data = {
      email: this.email.value,
      password: this.password.value,
      username: this.username.value,
    };
    if (registering) data.username = this.username.value;

    this.#setSending(true);
    this.#refreshSubmit();
    try {
      await (registering ? register(data) : login(data));
      if (!this.destroyed) this.props.navigate(getReturnPath() || '/', { replace: true });
    } catch (error) {
      if (this.destroyed) return;
      this.#showError(this.#errorText(error, registering));
      this.#refs.error.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } finally {
      if (!this.destroyed) this.#setSending(false);
    }
  }

  #errorText(error: unknown, registering: boolean) {
    if (!(error instanceof ApiError)) return 'Не удалось связаться с сервером. Попробуйте ещё раз.';
    if (registering && error.status === HttpStatus.CONFLICT) {
      return error.message === 'user with this username already exists'
        ? 'Это имя пользователя уже занято'
        : 'Пользователь с таким email уже существует';
    }
    if (!registering && error.status === HttpStatus.UNAUTHORIZED)
      return 'Неверный email или пароль';
    if (error.status === HttpStatus.BAD_REQUEST) return 'Проверьте заполнение полей';
    if (error.status >= 500) return 'Сервер временно недоступен. Попробуйте ещё раз.';
    return TEXTS[registering ? 'register' : 'login'].failed;
  }

  #setSending(sending: boolean) {
    this.#sending = sending;
    this.#refs.form.setAttribute('aria-busy', String(sending));
    [this.email, this.username, this.password].forEach((field) => field.setDisabled(sending));
    this.#refs.switchLink.inert = sending;
    const terms = this.query<HTMLInputElement>('[name=terms]');
    if (terms) terms.disabled = sending;
    this.props.onPendingChange?.(sending);
    this.#refs.button.textContent = sending
      ? this.#registering
        ? 'Регистрируем…'
        : 'Входим…'
      : this.#texts().button;
    this.#refreshSubmit();
  }
  #mobile() {
    return Boolean(this.props.mobileDesign) && matchMedia('(max-width: 767px)').matches;
  }

  #syncCopy() {
    const mobile = this.#mobile();
    const texts = this.#texts();
    this.#refs.title.textContent = mobile
      ? this.#registering
        ? 'Создайте аккаунт'
        : 'С возвращением'
      : texts.title;
    this.#refs.subtitle.textContent = mobile
      ? this.#registering
        ? 'Списки, оценки и колесо — на всех устройствах'
        : 'Войдите, чтобы видеть свои списки и оценки'
      : texts.subtitle;
    this.email.find('label').textContent = mobile ? 'Почта' : 'Email';
    this.username.find('label').textContent = mobile ? 'Имя' : 'Имя пользователя';
    const terms = this.query('[data-mobile-terms]');
    const recovery = this.query('[data-mobile-recovery]');
    if (terms) terms.hidden = !this.#registering;
    if (recovery) recovery.hidden = this.#registering;
  }
}
