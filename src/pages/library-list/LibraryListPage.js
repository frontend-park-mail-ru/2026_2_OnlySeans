import './library-list-page.css';
import templateSource from './LibraryListPage.hbs';
import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { countLabel } from '../../core/format.js';
import { loginPathHere } from '../../services/auth-return.js';
import { readLibrary, watchLibrary } from '../../services/library.js';
import { filmsByIds } from '../../services/catalog.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const LISTS = {
  watchlater: {
    title: 'Смотреть позже',
    note: 'Ваши планы на следующий киновечер.',
    empty: 'Здесь пока пусто. Нажимайте на часы у фильма, и он появится в этом списке.',
    guest: 'Войдите, чтобы откладывать фильмы на потом.',
  },
  favorite: {
    title: 'Избранное',
    note: 'Кино, к которому хочется вернуться.',
    empty: 'Здесь пока пусто. Нажимайте на сердце у фильма, и он появится в избранном.',
    guest: 'Войдите, чтобы отмечать любимые фильмы и собирать избранное.',
  },
  watched: {
    title: 'Просмотрено',
    note: 'Истории, которые вы уже посмотрели.',
    empty: 'Пока нет просмотренных фильмов. Отмечайте их через кнопку «Моё кино» на карточках.',
    guest: 'Войдите, чтобы отмечать просмотренные фильмы.',
  },
};

export class LibraryListPage extends Component {
  static template = template;

  context() {
    const list = LISTS[this.props.list];
    return { user: store.get('user'), guestText: list.guest, loginHref: loginPathHere() };
  }

  onRender() {
    const list = LISTS[this.props.list];
    document.title = `${list.title} | Frame`;
    this.watch(store.watch('user', () => this.update()));
    if (!store.get('user')) {
      this.insert('heading', new SectionHeading({ title: list.title, level: 1 }));
      return;
    }
    this.watch(watchLibrary(() => this.update()));
    this.#load(list);
  }

  #load(list) {
    loadInto(this, 'feed', {
      loading: 'Загружаем фильмы...',
      load: () => filmsByIds(readLibrary()[this.props.list]),
      render: (films) =>
        new FilmFeed({
          title: list.title,
          level: 1,
          note: list.note,
          films,
          count: films.length ? countLabel(films.length, ['фильм', 'фильма', 'фильмов']) : '',
          empty: list.empty,
          query: this.props.query,
        }),
      failure: () => 'Не удалось загрузить фильмы.',
    });
  }
}
