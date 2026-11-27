import './auth-page.css';
import './auth-centered.css';
import './auth-mobile.css';
import templateSource from './AuthPage.hbs';
import { Component } from '../../core/component.js';
import { authPath } from '../../services/auth-return.js';
import { AuthForm } from './form/AuthForm.js';
import { AuthFilmScene } from './scene/AuthFilmScene.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';

const template = await loadAssets({ template: templateSource });

const TITLES = { login: 'Вход | Frame', register: 'Регистрация | Frame' };

export class AuthPage extends Component<PageProps> {
  static template = template;
  form!: AuthForm;

  context() {
    const centered = this.props.query.get('layout') === 'centered';
    return {
      mode: this.props.mode,
      loginHref: authPath('login'),
      registerHref: authPath('register'),
      centered,
      layout: centered ? 'centered' : 'split',
      mark: new URL('../../assets/images/auth/centered-mark.svg', import.meta.url).href,
      letter: new URL('../../assets/images/auth/centered-f.svg', import.meta.url).href,
      word: new URL('../../assets/images/auth/centered-rame.svg', import.meta.url).href,
      mobileLogo: new URL('../../assets/images/logo-mobile.svg', import.meta.url).href,
      back: new URL('../../assets/images/auth/mobile-back.svg', import.meta.url).href,
    };
  }

  onRender() {
    const centered = this.props.query.get('layout') === 'centered';
    this.insert('scene', new AuthFilmScene({ centered }));
    this.form = this.insert(
      'form',
      new AuthForm({
        mode: this.props.mode || 'login',
        mobileDesign: !centered,
        navigate: this.props.navigate,
        onPendingChange: (pending: boolean) => {
          this.find('.auth-page__tabs').inert = pending;
        },
      }),
    );
    this.#showMode();
  }

  reuse(props: PageProps) {
    const { mode = 'login' } = props;
    if (
      (props.query.get('layout') === 'centered') !==
      (this.props.query.get('layout') === 'centered')
    )
      return false;
    this.props = { ...this.props, ...props, mode };
    this.form.setMode(mode);
    this.find('[data-mode=login]').setAttribute('href', authPath('login'));
    this.find('[data-mode=register]').setAttribute('href', authPath('register'));
    this.form.syncLinks();
    this.#showMode();
    return true;
  }

  #showMode() {
    const { mode = 'login' } = this.props;
    document.title = TITLES[mode];
    this.find('.auth-page__tabs').dataset.active = mode;
    this.findAll('.auth-page__tab').forEach((tab) => {
      if (tab.dataset.mode === mode) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }
}
