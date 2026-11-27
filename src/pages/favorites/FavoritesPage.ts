import './favorites-page.css';
import templateSource from './FavoritesPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { store } from '../../core/store.js';
import type { PageProps } from '../../app/router.js';
import type { Film } from '../../api/films.js';
import type { Profile } from '../../api/profile.js';
import { request } from '../../api/http.js';
import { loadCatalog } from '../../services/catalog.js';
import { libraryLoaded, loadLibrary, readLibrary, watchLibrary } from '../../services/library.js';
import { LibraryGuest } from '../library-list/LibraryGuest.js';
import { readShelves, shelfFilmIds, watchShelves } from '../../services/shelves.js';
import {
  FAVORITE_SORTS,
  favoriteShare,
  favoriteStats,
  parseFavoriteShare,
  similarFavorites,
  sortFavorites,
  type FavoriteSort,
} from '../../services/favorites.js';
import { normalizeSearch } from '../../services/search.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import type { CatalogRatings } from '../../services/catalog-filters.js';
import { loginPathHere } from '../../services/auth-return.js';
import { notify } from '../../services/notice.js';
import { readContentPreferences } from '../../services/content-preferences.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { PosterStack } from '../../components/poster-stack/PosterStack.js';
import { ViewToggle } from '../../components/view-toggle/ViewToggle.js';
import { MovieGrid } from '../../components/movie-grid/MovieGrid.js';
import type { Modal } from '../../components/modal/Modal.js';
import { FavoriteResults } from './FavoriteResults.js';
import { ShelfEditor } from './ShelfEditor.js';
import { ShelfPicker } from './ShelfPicker.js';
import { FavoriteShare } from './FavoriteShare.js';

const template = await loadAssets({ template: templateSource });
const heart = new URL('../../assets/images/favorites/heart.svg', import.meta.url).href;
const shareIcon = new URL('../../assets/images/favorites/share.svg', import.meta.url).href;
type FavoriteType = 'all' | 'movie' | 'series';

/** Личные полки локальны; публичная ссылка передаёт только снимок идентификаторов. */
export class FavoritesPage extends Component<PageProps> {
  static template = template;
  #catalog: Film[] = [];
  #scores = new Map<number, number>();
  #scoresKnown = false;
  #ratings: CatalogRatings = new Map();
  #ratingBusy = false;
  #ratingError = false;
  #ratingController: AbortController | null = null;
  #phase: 'loading' | 'ready' | 'error' | 'invalid' = 'loading';
  #sharedIds: number[] | null = null;
  #sort: FavoriteSort;
  #type: FavoriteType;
  #shelf: string;
  #search: string;
  #view: string;
  #dialog: Modal | null = null;
  #results: FavoriteResults | null = null;
  #recommendations: MovieGrid | null = null;
  #recommendationOffset = 0;

  constructor(props: PageProps) {
    super(props);
    this.#sort =
      FAVORITE_SORTS.find((sort) => sort.value === props.query.get('sort'))?.value ?? 'recent';
    const type = props.query.get('type');
    this.#type = type === 'movie' || type === 'series' ? type : 'all';
    this.#shelf = props.query.get('shelf') || '';
    this.#search = (props.query.get('q') || '').slice(0, 200);
    this.#view =
      (props.query.get('view') || readJson(StorageKey.CATALOG_VIEW, 'grid')) === 'list'
        ? 'list'
        : 'grid';
    try {
      this.#sharedIds = parseFavoriteShare(props.query);
    } catch {
      this.#phase = 'invalid';
    }
  }

  #source() {
    const byId = new Map(this.#catalog.map((film) => [film.id, film]));
    return (this.#sharedIds ?? readLibrary().favorite)
      .map((id) => byId.get(id))
      .filter((film): film is Film => Boolean(film));
  }

  #filtered() {
    let films = this.#source();
    if (this.#sharedIds === null && this.#shelf) {
      const shelf = readShelves().find((shelf) => shelf.id === this.#shelf);
      const ids = new Set(shelf?.filmIds ?? []);
      films = films.filter((film) => ids.has(film.id));
    }
    const needle = normalizeSearch(this.#search);
    films = films.filter(
      (film) =>
        (this.#type === 'all' || film.type === this.#type) &&
        normalizeSearch(`${film.title} ${film.originalTitle}`).includes(needle),
    );
    return sortFavorites(
      films,
      this.#ratingError ? 'recent' : this.#sort,
      this.#ratings,
      readLibrary().watched,
    );
  }

  #href(patch: Record<string, string> = {}) {
    const query = new URLSearchParams();
    if (this.#sharedIds) query.set('shared', this.#sharedIds.join(','));
    if (this.#shelf && !this.#sharedIds) query.set('shelf', this.#shelf);
    if (this.#type !== 'all') query.set('type', this.#type);
    if (this.#search.trim()) query.set('q', this.#search.trim());
    if (this.#sort !== 'recent') query.set('sort', this.#sort);
    query.set('view', this.#view);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) query.set(key, value);
      else query.delete(key);
    });
    return `/favorites?${query}`;
  }

  context() {
    const source = this.#source();
    const shared = this.#sharedIds !== null;
    const stats = favoriteStats(source);
    const shelves = shared ? [] : readShelves();
    return {
      heart,
      shareIcon,
      user: store.get('user'),
      guest: !store.get('user') && !this.props.query.has('shared'),
      loginHref: loginPathHere(),
      ready: this.#phase === 'ready',
      loading: this.#phase === 'loading',
      shared,
      empty: !source.length,
      title: shared ? 'Избранное по ссылке' : 'Избранное',
      stats,
      hours: stats.hours?.toLocaleString('ru') ?? '—',
      sourceCount: source.length,
      visibleCount: this.#filtered().length,
      search: this.#search,
      missing: (this.#sharedIds ?? readLibrary().favorite).length > source.length,
      shelfMissing:
        !shared && Boolean(this.#shelf) && !shelves.some((shelf) => shelf.id === this.#shelf),
      allHref: this.#href({ shelf: '' }),
      allCurrent: this.#shelf ? 'false' : 'page',
      shelves: shelves.map((shelf) => ({
        ...shelf,
        count: shelfFilmIds(shelf, readLibrary().favorite).length,
        href: this.#href({ shelf: shelf.id }),
        current: this.#shelf === shelf.id ? 'page' : 'false',
      })),
      canEditShelf: !shared && shelves.some((shelf) => shelf.id === this.#shelf),
      tabs: [
        { value: 'all', label: 'Всё' },
        { value: 'movie', label: 'Фильмы' },
        { value: 'series', label: 'Сериалы' },
      ].map((tab) => ({
        ...tab,
        current: tab.value === this.#type ? 'page' : 'false',
        href: this.#href({ type: tab.value === 'all' ? '' : tab.value }),
      })),
      sorts: FAVORITE_SORTS,
      scoresUnavailable: !shared && !this.#scoresKnown,
      recommendations:
        source.length > 0 &&
        similarFavorites(
          this.#catalog,
          source,
          readContentPreferences().hideWatchedRecommendations ? readLibrary().watched : [],
        ).length > 0,
      genreNote: stats.genres.slice(0, 2).join(' · '),
    };
  }

  onRender() {
    this.#results = null;
    this.#recommendations = null;
    document.title = 'Избранное | Frame';
    this.watch(
      store.watch('user', () => {
        this.#dialog?.close();
        this.#ratingController?.abort();
        this.#ratingBusy = false;
        this.#scores.clear();
        this.#scoresKnown = false;
        if (this.#phase !== 'invalid') this.#phase = 'loading';
        this.update();
      }),
    );
    if (!store.get('user') && !this.props.query.has('shared')) {
      this.insert('heading', new SectionHeading({ title: 'Избранное', level: 1 }));
      this.insert('guest', new LibraryGuest({ list: 'favorite' }));
      return;
    }
    if (this.#phase === 'invalid') {
      this.insert(
        'state',
        new EmptyState({
          title: 'Ссылка на список повреждена',
          text: 'Проверьте ссылку или откройте своё избранное.',
          href: '/favorites',
          linkText: 'Моё избранное',
        }),
      );
      return;
    }
    if (this.#phase === 'loading') {
      this.insert('state', new Skeleton({ variant: 'catalog' }));
      const controller = new AbortController();
      this.watch(() => controller.abort());
      void this.#load(controller.signal);
      return;
    }
    if (this.#phase === 'error') {
      this.insert(
        'state',
        new EmptyState({
          requestError: true,
          title: 'Не удалось загрузить избранное',
          text: 'Проверьте соединение и попробуйте ещё раз.',
          button: 'Повторить',
          onRetry: () => {
            this.#phase = 'loading';
            this.update();
          },
        }),
      );
      return;
    }
    const source = this.#source();
    this.watch(
      watchLibrary(() => {
        this.#ratingController?.abort();
        this.#ratingBusy = false;
        this.#ratingError = false;
        this.update();
      }),
    );
    this.watch(watchShelves(() => this.update()));
    if (!source.length) {
      const unavailable = (this.#sharedIds ?? readLibrary().favorite).length > 0;
      this.insert(
        'empty',
        new EmptyState({
          variant: 'favorite',
          title: unavailable ? 'Фильмы из списка недоступны' : 'В избранном пусто',
          text: unavailable
            ? 'Возможно, фильмы больше не доступны в каталоге.'
            : 'Нажмите на сердце на карточке фильма, и он появится здесь.',
          unit: 'фильмов',
          href: '/films',
          linkText: 'Перейти к фильмам',
        }),
      );
      return;
    }
    this.insert('posters', new PosterStack({ films: source, size: 'favorites' }));
    this.insert(
      'view',
      new ViewToggle({
        view: this.#view,
        onChange: (view) => {
          this.#view = view;
          writeJson(StorageKey.CATALOG_VIEW, view);
          this.#renderResults();
          this.#syncURL();
        },
      }),
    );
    this.#results = this.insert('results', new FavoriteResults(this.#resultProps()));
    this.find<HTMLSelectElement>('[name=sort]').value = this.#sort;
    this.delegate('input', '[data-favorite-search]', (_, input) => {
      this.#search = (input as HTMLInputElement).value;
      this.#renderResults();
      this.#syncURL();
    });
    this.delegate('change', '[name=sort]', (_, input) => {
      this.#sort =
        FAVORITE_SORTS.find((sort) => sort.value === (input as HTMLSelectElement).value)?.value ??
        'recent';
      this.#ratingError = false;
      this.#renderResults();
      this.#syncURL();
      if (this.#sort === 'rating') void this.#loadRatings();
    });
    this.delegate('click', '[data-create-shelf]', () => this.#editShelf());
    this.delegate('click', '[data-edit-shelf]', () => this.#editShelf(this.#shelf));
    this.delegate('click', '[data-share]', () => {
      const ids = this.#filtered().map((film) => film.id);
      try {
        favoriteShare(ids);
        this.#dialog = new FavoriteShare({ ids }).open();
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Не удалось создать ссылку', {
          type: 'error',
        });
      }
    });
    this.delegate('click', '[data-wheel]', () => {
      const ids = this.#filtered()
        .slice(0, 100)
        .map((film) => film.id);
      if (ids.length) this.props.navigate('/wheel?' + new URLSearchParams({ pool: ids.join(',') }));
      else notify('В списке нет фильмов для колеса');
    });
    this.delegate('click', '[data-retry-ratings]', () => {
      this.#ratingError = false;
      void this.#loadRatings();
    });
    this.delegate('click', '[data-refresh-recommendations]', () => {
      this.#recommendationOffset += 5;
      this.#showRecommendations();
    });
    this.#showRecommendations();
    this.#ratingStatus();
    if (this.#sort === 'rating' && !this.#ratingError) void this.#loadRatings();
    if (this.props.restoreScroll != null) {
      const y = this.props.restoreScroll;
      const frame = requestAnimationFrame(() => window.scrollTo(0, y));
      this.watch(() => cancelAnimationFrame(frame));
    }
  }

  #resultProps() {
    return {
      films: this.#filtered(),
      scores: this.#scores,
      scoresKnown: this.#scoresKnown,
      view: this.#view,
      shared: this.#sharedIds !== null,
      onRate: async (film: Film) => {
        try {
          const { RatingDialog } = await import('../../components/rating-dialog/RatingDialog.js');
          if (this.destroyed || !store.get('user')) return;
          this.#dialog = new RatingDialog({
            filmId: film.id,
            title: film.title,
            score: this.#scores.get(film.id) || 0,
            onSaved: (score) => {
              if (score) this.#scores.set(film.id, score);
              else this.#scores.delete(film.id);
              this.#renderResults();
            },
          }).open();
        } catch {
          if (!this.destroyed)
            notify('Не удалось открыть окно оценки. Повторите попытку.', { type: 'error' });
        }
      },
      onShelves: (film: Film) => {
        this.#dialog = new ShelfPicker({ filmId: film.id, title: film.title }).open();
      },
    };
  }

  #renderResults() {
    this.#results?.update(this.#resultProps());
    const count = this.query('[data-results-count]');
    if (count) count.textContent = `${this.#filtered().length}`;
  }

  #syncURL() {
    history.replaceState(history.state, '', this.#href());
    this.findAll<HTMLAnchorElement>('a[href^="/favorites?"]').forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set('view', this.#view);
      if (this.#search.trim()) url.searchParams.set('q', this.#search.trim());
      else url.searchParams.delete('q');
      if (this.#sort !== 'recent') url.searchParams.set('sort', this.#sort);
      else url.searchParams.delete('sort');
      link.setAttribute('href', `${url.pathname}?${url.searchParams}`);
    });
  }

  #editShelf(id?: string) {
    this.#dialog = new ShelfEditor({
      shelf: readShelves().find((shelf) => shelf.id === id),
      onSaved: (shelf) => {
        if (this.destroyed) return;
        this.props.navigate(this.#href({ shelf: shelf?.id ?? '' }));
      },
    }).open();
  }

  #showRecommendations() {
    const host = this.query('[data-recommendations]');
    if (!host) return;
    const candidates = similarFavorites(
      this.#catalog,
      this.#source(),
      readContentPreferences().hideWatchedRecommendations ? readLibrary().watched : [],
    );
    const start = this.#recommendationOffset % Math.max(1, candidates.length);
    const films = [...candidates.slice(start), ...candidates.slice(0, start)].slice(0, 5);
    if (this.#recommendations) this.remove(this.#recommendations);
    host.replaceChildren();
    this.#recommendations = this.insert(host, new MovieGrid({ films, view: 'grid' }));
  }

  async #load(signal: AbortSignal) {
    const owner = store.get('user')?.id;
    if (this.#sharedIds === null && !libraryLoaded()) {
      try {
        await loadLibrary();
      } catch {
        if (!signal.aborted && store.get('user')?.id === owner) {
          this.#phase = 'error';
          this.update();
        }
        return;
      }
    }
    if (signal.aborted || store.get('user')?.id !== owner) return;
    const [catalog, profile] = await Promise.allSettled([
      loadCatalog({ signal }),
      this.#sharedIds === null
        ? request<Profile>('/me/profile', { signal })
        : Promise.resolve(null),
    ]);
    if (signal.aborted || store.get('user')?.id !== owner) return;
    if (catalog.status === 'rejected') this.#phase = 'error';
    else {
      this.#catalog = catalog.value;
      this.#scoresKnown =
        profile.status === 'fulfilled' &&
        profile.value !== null &&
        Array.isArray(profile.value.ratings);
      if (profile.status === 'fulfilled' && profile.value && Array.isArray(profile.value.ratings))
        this.#scores = new Map(
          profile.value.ratings
            .filter((film) => typeof film.score === 'number' && film.score >= 1 && film.score <= 10)
            .map((film) => [film.id, film.score!]),
        );
      this.#phase = 'ready';
    }
    this.update();
  }

  async #loadRatings() {
    const films = this.#source().filter((film) => !this.#ratings.has(film.id));
    if (this.#ratingBusy || !films.length) return;
    const controller = new AbortController();
    this.#ratingController = controller;
    this.#ratingBusy = true;
    this.#ratingStatus();
    try {
      const ratings = await loadCatalogRatings(films, { signal: controller.signal });
      if (controller.signal.aborted || this.destroyed || this.#ratingController !== controller)
        return;
      ratings.forEach((rating, id) => this.#ratings.set(id, rating));
      this.#ratingError = false;
    } catch {
      if (controller.signal.aborted || this.destroyed) return;
      this.#ratingError = true;
    }
    if (this.destroyed || controller.signal.aborted) return;
    this.#ratingBusy = false;
    this.#renderResults();
    this.#ratingStatus();
  }

  #ratingStatus() {
    const status = this.query('[data-rating-status]');
    if (status)
      status.textContent = this.#ratingBusy
        ? 'Загружаем рейтинги…'
        : this.#ratingError
          ? 'Не удалось отсортировать по рейтингу. Показан порядок списка.'
          : '';
    const retry = this.query('[data-retry-ratings]');
    if (retry) retry.hidden = !this.#ratingError;
    const select = this.query<HTMLSelectElement>('[name=sort]');
    if (select) select.disabled = this.#ratingBusy;
  }

  destroy() {
    this.#dialog?.close();
    this.#ratingController?.abort();
    super.destroy();
  }
}
