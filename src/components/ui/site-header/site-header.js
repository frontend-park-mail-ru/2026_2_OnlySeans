import { BaseComponent } from '../base-component.js';
import { createSiteLogo } from '../site-logo/site-logo.js';

const template = window.Handlebars.compile(`
  <header class="site-header">
    <div class="site-header__brand"></div>
    <a class="site-header__login" href="/login" data-link>Войти</a>
  </header>
`);
export class SiteHeader extends BaseComponent {
  constructor() { super(template, {}); }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    element.querySelector('.site-header__brand').appendChild(createSiteLogo());
    return element;
  }
}
export const createSiteHeader = () => new SiteHeader().render();
