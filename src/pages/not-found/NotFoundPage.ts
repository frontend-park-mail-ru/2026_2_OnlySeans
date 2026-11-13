import './not-found-page.css';
import templateSource from './NotFoundPage.hbs';
import { Component } from '../../core/component.js';
import { Button } from '../../components/button/Button.js';
import { loadAssets } from '../../core/assets.js';

const noise = new URL('../../assets/images/tv-noise.png', import.meta.url).href;
const tv = new URL('../../assets/images/tv.png', import.meta.url).href;
const template = await loadAssets({ template: templateSource });

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
