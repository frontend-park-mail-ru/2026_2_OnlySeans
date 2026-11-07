import { Component } from '../../core/component.js';
import { Button } from '../../components/button/Button.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

const noise = new URL('../../assets/images/tv-noise.png', import.meta.url).href;
const tv = new URL('../../assets/images/tv.png', import.meta.url).href;
loadStyles(new URL('./not-found-page.css', import.meta.url));
const template = await loadTemplate(new URL('./NotFoundPage.hbs', import.meta.url));

export class NotFoundPage extends Component {
  static template = template;

  context() {
    return { noise, tv };
  }

  onRender() {
    document.title = 'Страница не найдена | Frame';
    this.insert('home', new Button({ text: 'На главную', href: '/' }));
  }
}
