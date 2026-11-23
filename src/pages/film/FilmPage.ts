import './film-page.css';
import templateSource from './FilmPage.hbs';
import { Component } from '../../core/component.js';
import { getFilm } from '../../api/films.js';
import { getFilmPeople } from '../../api/people.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { BackLink } from '../../components/back-link/BackLink.js';
import { FilmHero } from './film-hero/FilmHero.js';
import { FilmAbout } from './about/FilmAbout.js';
import { loadAssets } from '../../core/assets.js';
import { HttpStatus } from '../../api/errors.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';

const template = await loadAssets({ template: templateSource });

export class FilmPage extends Component {
  static template = template;

  #fetch() {
    const { id } = this.props.params;
    return Promise.all([
      getFilm(id),
      getFilmPeople(id)
        .then((people) => ({ people, failed: false }))
        .catch(() => ({ people: [], failed: true })),
    ]);
  }

  onRender() {
    document.title = 'Фильм | Frame';
    this.#load();
  }

  #load() {
    loadInto(this, 'hero', {
      loading: 'Загружаем фильм...',
      loadingView: () => new Skeleton({ variant: 'film' }),
      load: () => this.#fetch(),
      render: ([film, { people, failed }]) => {
        document.title = `${film.title} | Frame`;
        this.insert(
          'back',
          new BackLink(
            film.isSeries
              ? { href: '/series', text: 'Сериалы' }
              : { href: '/films', text: 'Фильмы' },
          ),
        );
        this.insert('about', new FilmAbout({ film, people, peopleFailed: failed }));
        return new FilmHero({ film });
      },
      failureView: (error, retry) =>
        new EmptyState({
          variant: error.status === HttpStatus.NOT_FOUND ? 'movie' : 'error',
          title:
            error.status === HttpStatus.NOT_FOUND
              ? 'Такого фильма нет в каталоге'
              : 'Не удалось загрузить фильм',
          text:
            error.status === HttpStatus.NOT_FOUND
              ? 'Возможно, ссылка устарела или фильм убрали. Попробуйте найти его через поиск.'
              : 'Проверьте подключение к сети и попробуйте ещё раз.',
          onRetry: error.status === HttpStatus.NOT_FOUND ? undefined : retry,
          href: '/films',
          linkText: 'В каталог',
        }),
    });
  }
}
