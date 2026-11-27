import './not-found-page.css';
import templateSource from './NotFoundPage.hbs';
import { Component } from '../../core/component.js';
import { Button } from '../../components/button/Button.js';
import { loadAssets } from '../../core/assets.js';

const noise = new URL('../../assets/images/tv-noise.png', import.meta.url).href;
const tv = new URL('../../assets/images/tv.png', import.meta.url).href;
const code = new URL('../../assets/images/not-found-code.svg', import.meta.url).href;
const signal = new URL('../../assets/images/not-found-signal.svg', import.meta.url).href;
const pixelCode = new URL('../../assets/images/not-found-code-pixel.svg', import.meta.url).href;
const pixelSignal = new URL('../../assets/images/not-found-signal-pixel.svg', import.meta.url).href;
const homeIcon = new URL('../../assets/images/not-found-home.svg', import.meta.url).href;
const searchIcon = new URL('../../assets/images/not-found-search.svg', import.meta.url).href;
const desktopCode = new URL('../../assets/images/not-found-code-desktop.svg', import.meta.url).href;
const desktopSignal = new URL('../../assets/images/not-found-signal-desktop.svg', import.meta.url)
  .href;
const desktopHome = new URL('../../assets/images/not-found-home-desktop.svg', import.meta.url).href;
const backIcon = new URL('../../assets/images/not-found-back.svg', import.meta.url).href;
const glow = new URL('../../assets/images/not-found-glow.svg', import.meta.url).href;
const template = await loadAssets({ template: templateSource });

/** Экран 404 использует общую навигацию и адаптивные слои телевизора из макета. */
export class NotFoundPage extends Component {
  static template = template;

  context() {
    return {
      noise,
      tv,
      code,
      signal,
      pixelCode,
      pixelSignal,
      desktopCode,
      desktopSignal,
      glow,
      mobile: matchMedia('(max-width: 767px)').matches,
    };
  }

  onRender() {
    document.title = 'Страница не найдена | Frame';
    const mobile = matchMedia('(max-width: 767px)');
    if (mobile.matches)
      this.insert(
        'search',
        new Button({
          text: 'Искать фильм',
          href: '/search',
          variant: 'secondary',
          imageBefore: searchIcon,
        }),
      );
    else {
      this.insert(
        'back',
        new Button({
          text: 'Назад',
          variant: 'secondary',
          imageBefore: backIcon,
          onClick: () => {
            if (history.length > 1) history.back();
            else this.props.navigate('/');
          },
        }),
      );
      const host = this.find('.not-found__tv');
      const observer = new ResizeObserver(() =>
        host.style.setProperty('--tv-scale', String(host.clientWidth / 600)),
      );
      observer.observe(host);
      this.watch(() => observer.disconnect());
    }
    this.insert(
      'home',
      new Button({
        text: 'На главную',
        href: '/',
        imageBefore: mobile.matches ? homeIcon : desktopHome,
      }),
    );
    const resize = () => this.update();
    mobile.addEventListener('change', resize);
    this.watch(() => mobile.removeEventListener('change', resize));
  }
}
