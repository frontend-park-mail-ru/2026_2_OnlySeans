import { BaseComponent } from '../base-component.js';

const template = window.Handlebars.compile(`
  <a class="site-logo {{className}}" href="/discover" data-link aria-label="Frame — лента фильмов"><span>F</span>rame</a>
`);

export class SiteLogo extends BaseComponent {
  constructor({ className = '' } = {}) { super(template, { className }); }
}

export const createSiteLogo = (props) => new SiteLogo(props).render();
