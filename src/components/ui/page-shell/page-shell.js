import { BaseComponent } from '../base-component.js';
import { createSiteHeader } from '../site-header/site-header.js';
import { createSideMenu } from '../side-menu/side-menu.js';

const template = window.Handlebars.compile(`
  <div class="page-shell">
    <div class="page-shell__body">
      <aside class="page-shell__aside"></aside>
      <main class="page-shell__content"></main>
    </div>
  </div>
`);

export class PageShell extends BaseComponent {
  constructor({ navigate, content }) {
    super(template, {});
    this.navigate = navigate;
    this.content = content;
  }

  create() {
    if (this.element) return this.element;

    const element = super.create();
    element.prepend(createSiteHeader({ navigate: this.navigate }));
    element.querySelector('.page-shell__aside').appendChild(createSideMenu());
    element.querySelector('.page-shell__content').appendChild(this.content);

    return element;
  }
}

export const createPageShell = (props) => new PageShell(props).render();

export const loadData = (content, promise, onData) => {
  const status = content.querySelector('.page-status');

  promise
    .then((data) => {
      status.textContent = '';
      onData(data);
    })
    .catch((error) => {
      console.error('Не удалось загрузить данные:', error);
      status.textContent = 'Не удалось загрузить данные. Обновите страницу.';
    });
};
