import { BaseComponent } from '../base-component.js';
import { getPreferredTheme, setTheme } from '../../../services/theme.js';

const template = window.Handlebars.compile(`
  <button class="theme-toggle" type="button" aria-label="{{label}}"><span class="theme-toggle__icon" aria-hidden="true">{{icon}}</span></button>
`);

export class ThemeToggle extends BaseComponent {
  constructor() {
    const light = getPreferredTheme() === 'light';
    super(template, { label: light ? 'Включить тёмную тему' : 'Включить светлую тему', icon: light ? '☀' : '☾' });
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    element.addEventListener('click', () => {
      const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      setTheme(theme);
      element.querySelector('span').textContent = theme === 'light' ? '☀' : '☾';
      element.setAttribute('aria-label', theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
    });
    return element;
  }
}
export const createThemeToggle = () => new ThemeToggle().render();
