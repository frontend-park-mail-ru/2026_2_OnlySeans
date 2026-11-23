import './home-page.css';
import templateSource from './HomePage.hbs';
import type { Film } from '../../api/films.js';
import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { store } from '../../core/store.js';
import { loadCatalog } from '../../services/catalog.js';
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

  context() {
    return { ready: this.#state === 'ready', offline: !navigator.onLine };
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
          title: empty ? 'Каталог пока пуст' : 'Не удалось загрузить каталог',
          text: empty
            ? 'Мы готовим подборки и ленту. Обновите страницу чуть позже.'
            : 'Проверьте подключение к сети и попробуйте ещё раз.',
          button: empty ? 'Обновить' : 'Повторить',
          onRetry: () => this.#retry(),
        }),
      );
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
        count: countLabel(this.#films.length, [
          'фильм и сериал',
          'фильма и сериала',
          'фильмов и сериалов',
        ]),
        empty: 'Каталог пока пуст.',
        query: this.props.query,
        filters: true,
        infinite: true,
      }),
    );
    this.delegate('click', '[data-retry]', () => this.#retry());
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
    this.#loadCollections();
  }

  async #load() {
    let active = true;
    this.watch(() => {
      active = false;
    });
    try {
      const films = await loadCatalog({ fresh: this.#fresh });
      this.#fresh = false;
      if (!active) return;
      this.#films = films;
      this.#state = films.length ? 'ready' : 'empty';
    } catch {
      if (!active) return;
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
    loadInto(this, grid, {
      loadingView: () => new Skeleton({ variant: 'collections' }),
      load: () => getCollections({ signal: controller.signal }),
      render: (collections) => {
        collections
          .slice(0, 3)
          .forEach((item) =>
            this.insert(grid, new CollectionCard({ ...item, href: `/collections/${item.id}` })),
          );
        return collections.length ? null : new StatusMessage({ text: 'Подборок пока нет.' });
      },
      failure: () => 'Не удалось загрузить подборки.',
    });
  }
}
