import { BaseComponent } from '../base-component.js';
import { getPreferredTheme, setTheme } from '../../../services/theme.js';

const template = window.Handlebars.compile(`
  <button class="theme-toggle" type="button" aria-label="{{label}}">
    <span class="theme-toggle__icon" aria-hidden="true">
      <svg class="theme-toggle__moon" viewBox="0 0 24 24"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>
      <svg class="theme-toggle__sun" viewBox="0 0 24 24"><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/></svg>
    </span>
  </button>
`);

export class ThemeToggle extends BaseComponent {
  constructor() {
    const light = getPreferredTheme() === 'light';
    // Какой значок виден (луна или солнце), решает CSS по атрибуту data-theme у <html>.
    super(template, { label: light ? 'Включить тёмную тему' : 'Включить светлую тему' });
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    element.addEventListener('click', () => {
      const theme =
        document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      void setTheme(theme, { origin: element });
    });
    return element;
  }
}
export const createThemeToggle = () => new ThemeToggle().render();
