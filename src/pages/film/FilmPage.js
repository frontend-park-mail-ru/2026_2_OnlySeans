import './film-page.css';
import templateSource from './FilmPage.hbs';
import { Component } from '../../core/component.js';
import { getFilm } from '../../api/films.js';
import { getFilmPeople } from '../../api/people.js';
import { loadCatalog } from '../../services/catalog.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { BackLink } from '../../components/back-link/BackLink.js';
import { FilmHero } from './film-hero/FilmHero.js';
import { FilmAbout } from './about/FilmAbout.js';
import { loadAssets } from '../../core/assets.js';
import { HttpStatus } from '../../api/errors.js';

const template = await loadAssets({ template: templateSource });

export class FilmPage extends Component {
  static template = template;

  #request = null;

  prepare() {
    this.#request = this.#fetch();
    return Promise.allSettled([this.#request, loadCatalog()]);
  }

  #fetch() {
    const { id } = this.props.params;
    return Promise.all([getFilm(id), getFilmPeople(id).catch(() => [])]);
  }

  onRender() {
    document.title = 'Фильм | Frame';
    this.#load();
  }

  #load() {
    loadInto(this, 'hero', {
      loading: 'Загружаем фильм...',
      load: () => {
        const request = this.#request ?? this.#fetch();
        this.#request = null;
        return request;
      },
      render: ([film, people]) => {
        document.title = `${film.title} | Frame`;
        this.insert(
          'back',
          new BackLink(
            film.isSeries
              ? { href: '/series', text: 'Сериалы' }
              : { href: '/films', text: 'Фильмы' },
          ),
        );
        this.insert('about', new FilmAbout({ film, people }));
        return new FilmHero({ film });
      },
      failure: (error) =>
        error.status === HttpStatus.NOT_FOUND
          ? { text: 'Такого фильма нет в каталоге.', retry: false }
          : 'Не удалось загрузить фильм.',
    });
  }
}
