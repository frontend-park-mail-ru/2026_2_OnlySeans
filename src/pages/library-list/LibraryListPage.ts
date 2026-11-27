import './library-list-page.css';
import templateSource from './LibraryListPage.hbs';
import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { countLabel } from '../../core/format.js';
import { authPath, loginPathHere } from '../../services/auth-return.js';
import { libraryLoaded, loadLibrary, readLibrary, watchLibrary } from '../../services/library.js';
import { filmsByIds } from '../../services/catalog.js';
import type { PageProps } from '../../app/router.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { loadAssets } from '../../core/assets.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import type { WatchLaterList } from './WatchLaterList.js';
import { LibraryGuest } from './LibraryGuest.js';
import { StorageKey, writeJson } from '../../services/storage.js';

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

export class LibraryListPage extends Component<PageProps> {
  static template = template;
  #watchLater: typeof WatchLaterList | undefined;

  context() {
    const list = LISTS[this.props.list || 'favorite'];
    return {
      user: store.get('user'),
      watchlater: this.props.list === 'watchlater',
      guestText: list.guest,
      loginHref: loginPathHere(),
      registerHref: authPath('register', '/watch-later'),
      guestOrbit: new URL('../../assets/images/library/guest-orbit.svg', import.meta.url).href,
      guestGlow: new URL('../../assets/images/library/guest-glow.png', import.meta.url).href,
      guestDisc: new URL('../../assets/images/library/guest-disc.svg', import.meta.url).href,
      guestClock: new URL('../../assets/images/library/guest-clock.svg', import.meta.url).href,
      guestLockDisc: new URL('../../assets/images/library/guest-lock-disc.svg', import.meta.url)
        .href,
      guestLock: new URL('../../assets/images/library/guest-lock.svg', import.meta.url).href,
      guestSparkOne: new URL('../../assets/images/library/guest-spark-one.svg', import.meta.url)
        .href,
      guestSparkTwo: new URL('../../assets/images/library/guest-spark-two.svg', import.meta.url)
        .href,
      guestSparkThree: new URL('../../assets/images/library/guest-spark-three.svg', import.meta.url)
        .href,
    };
  }

  onRender() {
    const list = LISTS[this.props.list || 'favorite'];
    document.title = `${list.title} | Frame`;
    this.watch(store.watch('user', () => this.update()));
    if (!store.get('user')) {
      this.insert('heading', new SectionHeading({ title: list.title, level: 1 }));
      if (this.props.list !== 'watchlater')
        this.insert(
          'guest',
          new LibraryGuest({ list: this.props.list === 'watched' ? 'watched' : 'favorite' }),
        );
      return;
    }
    this.watch(watchLibrary(() => this.update()));
    this.#load(list);
  }

  #load(list: (typeof LISTS)[keyof typeof LISTS]) {
    const controller = new AbortController();
    this.watch(() => controller.abort());
    let fresh = false;
    loadInto(this, 'feed', {
      loading: 'Загружаем фильмы...',
      loadingView: () => new Skeleton({ variant: 'catalog' }),
      load: async () => {
        if (!libraryLoaded()) await loadLibrary();
        controller.signal.throwIfAborted();
        const operation = filmsByIds(readLibrary()[this.props.list || 'favorite'], {
          signal: controller.signal,
          fresh,
        });
        fresh = true;
        const [films, view] = await Promise.all([
          operation,
          this.props.list === 'watchlater' ? import('./WatchLaterList.js') : null,
        ]);
        this.#watchLater = view?.WatchLaterList;
        return films;
      },
      render: (films) =>
        films.length && this.#watchLater
          ? new this.#watchLater({ films, query: new URLSearchParams(location.search) })
          : films.length
            ? new FilmFeed({
                title: list.title,
                level: 1,
                note: list.note,
                films,
                count: films.length ? countLabel(films.length, ['фильм', 'фильма', 'фильмов']) : '',
                empty: list.empty,
                query: this.props.query,
                initialView: new URLSearchParams(location.search).get('view') || undefined,
                audienceRatings: true,
                onViewChange: (view) => {
                  writeJson(StorageKey.CATALOG_VIEW, view);
                  const query = new URLSearchParams(location.search);
                  query.set('view', view);
                  history.replaceState(history.state, '', `${location.pathname}?${query}`);
                },
              })
            : new EmptyState({
                variant: this.props.list || 'favorite',
                title:
                  this.props.list === 'watched'
                    ? 'Пока ничего не просмотрено'
                    : 'Смотреть позже — пусто',
                text:
                  this.props.list === 'watched'
                    ? 'Отмечайте просмотренное глазом на карточке фильма.'
                    : 'Нажимайте на часы на карточке фильма, чтобы отложить его на вечер.',
                unit: 'фильмов',
                href: '/films',
                linkText: 'Перейти к фильмам',
              }),
      failure: () => 'Не удалось загрузить фильмы.',
      failureView: (error, retry) =>
        new EmptyState({
          requestError: true,
          title: 'Не удалось загрузить фильмы',
          text: 'Проверьте соединение и попробуйте ещё раз.',
          button: 'Повторить',
          onRetry: retry,
          href: '/films',
          linkText: 'В каталог',
        }),
    });
  }
}
