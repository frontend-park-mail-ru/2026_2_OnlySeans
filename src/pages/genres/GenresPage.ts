import './genres-page.css';
import templateSource from './GenresPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { loadCatalog } from '../../services/catalog.js';
import { countLabel } from '../../core/format.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';

const template = await loadAssets({ template: templateSource });

/** Каталог жанров; количество и изображения получаются из фильмов API. */
export class GenresPage extends Component {
  static template = template;

  onRender() {
    document.title = 'Жанры | Frame';
    this.insert('heading', new SectionHeading({ title: 'Жанры', level: 1 }));
    if (this.props.loaded) {
      if (!this.props.genres.length)
        this.insert(
          this.find('.genres-page__grid'),
          new EmptyState({
            title: 'Жанров пока нет',
            text: 'Добавленные в каталог фильмы появятся здесь.',
          }),
        );
      return;
    }
    loadInto(this, 'genres', {
      load: loadCatalog,
      render: (films) => {
        const genres = new Map<string, typeof films>();
        films.forEach((film) =>
          film.genres.forEach((name) => {
            if (!genres.has(name)) genres.set(name, []);
            genres.get(name).push(film);
          }),
        );
        this.update({
          loaded: true,
          total: films.length,
          genres: [...genres].map(([name, items]) => ({
            name,
            count: countLabel(items.length, ['фильм', 'фильма', 'фильмов']),
            poster: items.find((film) => film.poster)?.poster,
            href: `/films?${new URLSearchParams({ genre: name })}`,
          })),
        });
        return null;
      },
    });
  }

  context() {
    return this.props;
  }
}
