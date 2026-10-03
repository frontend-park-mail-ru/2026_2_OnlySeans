import { BaseComponent } from '../base-component.js';
import { createThemeToggle } from '../theme-toggle/theme-toggle.js';

const template = window.Handlebars.compile(`
  <header class="site-header">
    <a class="site-header__logo" href="/discover" data-link aria-label="OnlySeans — лента фильмов">ONLY<span>SEANS</span></a>
    <div class="site-header__actions"><a class="site-header__login" href="/login" data-link>Войти</a></div>
  </header>
`);
export class SiteHeader extends BaseComponent {
  constructor() { super(template, {}); }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    element.querySelector('.site-header__actions').appendChild(createThemeToggle());
    return element;
  }
}
export const createSiteHeader = () => new SiteHeader().render();
