import './home-page.css';
import templateSource from './HomePage.hbs';
import type { Film } from '../../api/films.js';
import { ApiError } from '../../api/http.js';
import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { store } from '../../core/store.js';
import { CatalogPager } from '../../services/catalog-pager.js';
import { visibleContent } from '../../services/content-preferences.js';
import { getCollections } from '../../api/collections.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { Spotlight } from './spotlight/Spotlight.js';
import { WatchLater } from './watch-later/WatchLater.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

/** Главная: загрузка, каталог, пустое состояние и повтор запроса при ошибке. */
export class HomePage extends Component {
  static template = template;

  #state: 'loading' | 'ready' | 'empty' | 'error' = 'loading';
  #films: Film[] = [];
  #fresh = false;
  #pager: CatalogPager | undefined;
  #error: unknown;

  context() {
    return {
      ready: this.#state === 'ready',
      failed: this.#state === 'error',
      offline: !navigator.onLine,
      offlineIcon: new URL('../../assets/images/feed/offline.svg', import.meta.url).href,
      offlineRetry: new URL('../../assets/images/feed/offline-retry.svg', import.meta.url).href,
    };
  }

  onRender() {
    document.title = 'Frame';
    if (this.#state === 'loading') {
      this.insert('state', new Skeleton());
      void this.#load();
      return;
    }
    if (this.#state !== 'ready') {
      const empty = this.#state === 'empty';
      this.insert(
        'state',
        new EmptyState({
          requestError: !empty,
          title: empty ? 'Каталог пока пуст' : 'Не удалось загрузить каталог',
          text: empty
            ? 'Мы готовим подборки и ленту. Обновите страницу чуть позже.'
            : 'Проверьте подключение к сети и попробуйте ещё раз.',
          button: empty ? 'Обновить' : 'Повторить',
          onRetry: () => this.#retry(),
          code: this.#error instanceof ApiError && !empty ? this.#error.status : '',
        }),
      );
      if (!empty) this.on('online', () => this.#retry(), window);
      return;
    }

    this.insert('spotlight', new Spotlight({ films: this.#films }));
    if (store.get('user')) this.insert('watch-later', new WatchLater({ films: this.#films }));
    else this.find('[data-slot="watch-later"]').remove();
    this.insert(
      'collections-heading',
      new SectionHeading({
        title: 'Подборки',
        link: { href: '/collections', text: 'Все подборки' },
      }),
    );
    this.insert(
      'feed',
      new FilmFeed({
        anchor: 'feed',
        title: 'Лента',
        note: 'Знакомые истории и новые открытия.',
        films: this.#films,
        pager: this.#pager,
        count:
          (this.#pager?.complete === false ? 'Загружено: ' : '') +
          countLabel(this.#films.length, [
            'фильм и сериал',
            'фильма и сериала',
            'фильмов и сериалов',
          ]),
        empty: 'Каталог пока пуст.',
        query: this.props.query,
        filters: true,
        infinite: true,
        rememberKey: 'home',
        endLabel: 'Вы досмотрели всё',
      }),
    );
    this.delegate('click', '[data-retry]', () => {
      if (navigator.onLine) this.#retry();
    });
    this.on(
      'offline',
      () => {
        this.find('.home-page__offline').dataset.offline = 'true';
      },
      window,
    );
    this.on(
      'online',
      () => {
        this.find('.home-page__offline').dataset.offline = 'false';
      },
      window,
    );
    const controller = new AbortController();
    this.watch(() => controller.abort());
    void this.#loadCollections().then(() => {
      if (controller.signal.aborted || this.props.restoreScroll == null) return;
      const frame = requestAnimationFrame(() => {
        if (!controller.signal.aborted) window.scrollTo(0, this.props.restoreScroll);
      });
      this.watch(() => cancelAnimationFrame(frame));
    });
  }

  async #load() {
    const controller = new AbortController();
    this.watch(() => controller.abort());
    try {
      const saved = FilmFeed.snapshot('home');
      this.#pager = new CatalogPager({ fresh: this.#fresh });
      await this.#pager.loadTo(
        saved.visible,
        (films) => visibleContent(films).filter((film) => FilmFeed.category(film, saved.filter)),
        controller.signal,
      );
      const films = visibleContent(this.#pager.films);
      this.#fresh = false;
      if (controller.signal.aborted) return;
      this.#films = films;
      this.#state = films.length ? 'ready' : 'empty';
    } catch (error) {
      if (controller.signal.aborted) return;
      this.#error = error;
      this.#state = 'error';
    }
    this.update();
  }

  #retry() {
    this.#fresh = true;
    this.#state = 'loading';
    this.update();
  }

  #loadCollections() {
    const grid = this.find('.home-page__collection-grid');
    const controller = new AbortController();
    this.watch(() => controller.abort());
    return loadInto(this, grid, {
      loadingView: () => new Skeleton({ variant: 'collections' }),
      load: () => getCollections({ signal: controller.signal }),
      render: (collections) => {
        collections
          .slice(0, 3)
          .forEach((item) =>
            this.insert(
              grid,
              new CollectionCard({ ...item, href: `/collections/${item.id}`, compact: true }),
            ),
          );
        return collections.length ? null : new StatusMessage({ text: 'Подборок пока нет.' });
      },
      failure: () => 'Не удалось загрузить подборки.',
    });
  }
}
