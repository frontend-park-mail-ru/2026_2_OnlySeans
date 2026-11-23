import './text-field.css';
import templateSource from './TextField.hbs';
import { Component } from '../../core/component.js';
import { limitTextInput } from '../../services/text-limit.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class TextField extends Component {
  static template = template;
  input: HTMLInputElement;

  context() {
    const type = this.props.password ? 'password' : this.props.type || 'text';
    return { ...this.props, id: `field-${this.props.name}`, type };
  }

  onRender() {
    this.input = this.find<HTMLInputElement>('.text-field__input');
    if (this.props.maxLength) limitTextInput(this.input, this.props.maxLength);
    if (!this.props.password) return;
    this.delegate('click', '.text-field__toggle', (event, button) =>
      this.#toggleVisibility(button),
    );
    const caps = this.find('.text-field__caps');
    const syncCaps = (event) => {
      caps.hidden = !event.getModifierState?.('CapsLock');
    };
    this.on('keydown', syncCaps, this.input);
    this.on('keyup', syncCaps, this.input);
    this.on('blur', () => (caps.hidden = true), this.input);
  }

  get value() {
    return this.props.password ? this.input.value : this.input.value.trim();
  }

  setError(message) {
    this.element.classList.toggle('text-field--invalid', Boolean(message));
    this.input.setAttribute('aria-invalid', String(Boolean(message)));
    this.find('.text-field__hint').textContent = message || '';
  }

  setDisabled(disabled) {
    this.input.disabled = disabled;
  }

  #toggleVisibility(button) {
    const show = this.input.type === 'password';
    this.input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
    button.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
  }
}
