import { createAuthScene } from './auth-scene.js';
import { createSiteLogo } from '../../components/ui/site-logo/site-logo.js';
import { element } from '../../utils/dom.js';

export const createAuthLayout = ({ mode, title, subtitle }) => {
  const page = element('main', 'login-page');
  page.dataset.authShell = '';
  const panel = element('section', 'login-panel');
  panel.setAttribute('aria-labelledby', 'auth-title');
  const content = element('div', 'login-panel__content');
  content.innerHTML = `
    <div class="login-panel__brand">
      <img src="${new URL('../../media/auth/logo-mark.svg', import.meta.url).href}" width="44" height="44" alt="" aria-hidden="true">
    </div>
    <nav class="login-tabs" aria-label="Авторизация">
      <a href="/login" data-link>Вход</a>
      <a href="/register" data-link>Регистрация</a>
    </nav>
    <div class="auth-form-slot"><div class="auth-form-view">
      <h1 id="auth-title"></h1>
      <p class="login-panel__subtitle"></p>
    </div></div>`;
  content.querySelector('.login-panel__brand').append(createSiteLogo());
  content.querySelector('h1').textContent = title;
  content.querySelector('.login-panel__subtitle').textContent = subtitle;
  const tabs = content.querySelector('.login-tabs');
  tabs.dataset.active = mode;
  tabs.querySelector(`a[href="/${mode}"]`).setAttribute('aria-current', 'page');
  panel.append(content);
  page.append(panel, createAuthScene());
  return { page, card: content.querySelector('.auth-form-view') };
};

// при переходе между входом и регистрацией сцена, логотип и вкладки не перерисовываются
export const updateAuthLayout = (current, next) => {
  current.setAuthMode(next.querySelector('.login-tabs').dataset.active);
  const tabs = current.querySelector('.login-tabs');
  const activeElement = document.activeElement;
  if (!current.contains(activeElement) || activeElement.closest('.switch-link')) {
    tabs.querySelector('[aria-current="page"]').focus({ preventScroll: true });
  }
};
