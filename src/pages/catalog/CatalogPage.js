import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { loadCatalog } from '../../services/catalog.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./catalog-page.css', import.meta.url));
const template = await loadTemplate(new URL('./CatalogPage.hbs', import.meta.url));

const SECTIONS = {
  movie: {
    title: 'Фильмы',
    note: 'Большие истории для вашего экрана.',
    forms: ['фильм', 'фильма', 'фильмов'],
  },
  series: {
    title: 'Сериалы',
    note: 'Истории, с которыми хочется остаться подольше.',
    forms: ['сериал', 'сериала', 'сериалов'],
  },
};

export class CatalogPage extends Component {
  static template = template;

  onRender() {
    const section = SECTIONS[this.props.type];
    document.title = `${section.title} | Frame`;
    this.#load(section);
  }

  #load(section) {
    loadInto(this, 'feed', {
      loading: 'Загружаем фильмы...',
      load: async () => (await loadCatalog()).filter((film) => film.type === this.props.type),
      render: (films) =>
        new FilmFeed({
          title: section.title,
          level: 1,
          note: section.note,
          films,
          count: countLabel(films.length, section.forms),
          empty: 'В этом разделе пока нет фильмов.',
          query: this.props.query,
        }),
      failure: () => 'Не удалось загрузить каталог.',
    });
  }
}
