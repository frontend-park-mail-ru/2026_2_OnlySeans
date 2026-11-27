import './map-page.css';
import templateSource from './MapPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

/** Обзор карты без вымышленных мест: география из макета, точки ожидают данные сервера. */
export class MapPage extends Component {
  static template = template;

  onRender() {
    document.title = 'Карта съёмок | Frame';
    let zoom = 1;
    const image = this.find<HTMLImageElement>('.map-page__world');
    const viewport = this.find('.map-page__viewport');
    const sync = () => {
      image.style.width = `${Math.max(viewport.clientWidth, matchMedia('(max-width: 767px)').matches ? 900 : 0) * zoom}px`;
      this.find('[data-map-zoom]').textContent = `${Math.round(zoom * 100)} %`;
      this.find<HTMLButtonElement>('[data-map-minus]').disabled = zoom <= 1;
      this.find<HTMLButtonElement>('[data-map-plus]').disabled = zoom >= 3;
    };
    this.delegate('click', '[data-map-plus]', () => {
      zoom = Math.min(3, zoom + 0.5);
      sync();
    });
    this.delegate('click', '[data-map-minus]', () => {
      zoom = Math.max(1, zoom - 0.5);
      sync();
    });
    this.delegate('click', '[data-map-reset]', () => {
      zoom = 1;
      sync();
      viewport.scrollTo(0, 0);
    });
    this.on(
      'error',
      () => {
        this.find('[data-map-image-error]').hidden = false;
      },
      image,
    );
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(viewport);
    this.watch(() => observer.disconnect());
  }
}
