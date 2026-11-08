import './collection-page.css';
import templateSource from './CollectionPage.hbs';
import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { getCollection } from '../../api/collections.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { CollectionHero } from './CollectionHero.js';
import { loadAssets } from '../../core/assets.js';
import { HttpStatus } from '../../api/errors.js';

const template = await loadAssets({ template: templateSource });

const FILM_FORMS = ['фильм', 'фильма', 'фильмов'];

export class CollectionPage extends Component {
  static template = template;

  onRender() {
    document.title = 'Подборка | Frame';
    this.#load();
  }

  #load() {
    loadInto(this, 'content', {
      loading: 'Загружаем подборку...',
      load: () => getCollection(this.props.params.id),
      render: (collection) => {
        document.title = `${collection.title} | Frame`;
        const count = countLabel(collection.films.length, FILM_FORMS);
        this.insert(
          this.element,
          new FilmFeed({
            title: 'Фильмы подборки',
            films: collection.films,
            count,
            empty: 'В этой подборке пока нет фильмов.',
            query: this.props.query,
          }),
        );
        return new CollectionHero({ ...collection, count });
      },
      failure: (error) =>
        error.status === HttpStatus.NOT_FOUND
          ? { text: 'Подборка не найдена.', retry: false }
          : 'Не удалось загрузить подборку.',
    });
  }
}
