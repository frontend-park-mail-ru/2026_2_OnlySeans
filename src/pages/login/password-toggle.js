import { element } from '../../utils/dom.js';
export const addPasswordToggle = (field, autocomplete) => {
  const input = field.querySelector('input');
  input.autocomplete = autocomplete;
  field.classList.add('field--password');
  const capsIndicator = element('span', 'field__caps');
  capsIndicator.hidden = true;
  capsIndicator.title = 'Caps Lock включён';
  capsIndicator.setAttribute('role', 'status');
  capsIndicator.setAttribute('aria-live', 'polite');
  capsIndicator.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.5 3.5 9h4v4h5V9h4L10 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 16h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span class="field__caps-text"></span>`;
  const setCapsLock = (enabled) => {
    capsIndicator.hidden = !enabled;
    capsIndicator.querySelector('.field__caps-text').textContent = enabled
      ? 'Caps Lock включён'
      : '';
    field.classList.toggle('field--caps-lock', enabled);
  };
  const updateCapsLock = (event) => {
    if (typeof event.getModifierState === 'function')
      setCapsLock(event.getModifierState('CapsLock'));
  };
  input.addEventListener('keydown', updateCapsLock);
  input.addEventListener('keyup', updateCapsLock);
  input.addEventListener('pointerdown', updateCapsLock);
  input.addEventListener('blur', () => setCapsLock(false));
  const toggle = element('button');
  toggle.type = 'button';
  toggle.className = 'field__toggle';
  toggle.setAttribute('aria-label', 'Показать пароль');
  toggle.setAttribute('aria-controls', input.id);
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = `<img src="${new URL('../../media/auth/password-hidden.png', import.meta.url).href}" width="20" height="20" alt="">`;
  const icon = toggle.querySelector('img');
  const shownIcon = new URL('../../media/auth/password-shown.png', import.meta.url).href;
  const hiddenIcon = icon.src;
  toggle.addEventListener('click', () => {
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    icon.src = visible ? shownIcon : hiddenIcon;
    toggle.setAttribute('aria-pressed', String(visible));
    toggle.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
  });
  field.append(capsIndicator, toggle);
  return input;
};
