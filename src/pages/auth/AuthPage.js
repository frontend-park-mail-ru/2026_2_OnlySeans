import './auth-page.css';
import templateSource from './AuthPage.hbs';
import { Component } from '../../core/component.js';
import { authPath } from '../../services/auth-return.js';
import { Logo } from '../../components/logo/Logo.js';
import { AuthForm } from './form/AuthForm.js';
import { AuthScene } from './scene/AuthScene.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const TITLES = { login: 'Вход | Frame', register: 'Регистрация | Frame' };

export class AuthPage extends Component {
  static template = template;

  context() {
    return {
      mode: this.props.mode,
      loginHref: authPath('login'),
      registerHref: authPath('register'),
    };
  }

  onRender() {
    this.insert('logo', new Logo());
    this.insert('scene', new AuthScene());
    this.form = this.insert(
      'form',
      new AuthForm({ mode: this.props.mode, navigate: this.props.navigate }),
    );
    this.#showMode();
  }

  reuse({ mode }) {
    if (mode === this.props.mode) return true;
    this.props = { ...this.props, mode };
    this.form.setMode(mode);
    this.#showMode();
    return true;
  }

  #showMode() {
    const { mode } = this.props;
    document.title = TITLES[mode];
    this.find('.auth-page__tabs').dataset.active = mode;
    this.findAll('.auth-page__tab').forEach((tab) => {
      if (tab.dataset.mode === mode) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }
}
