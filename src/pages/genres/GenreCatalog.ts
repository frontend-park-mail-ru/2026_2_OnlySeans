import templateSource from './GenreCatalog.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';
import type { Film } from '../../api/films.js';
import { loadCatalog } from '../../services/catalog.js';
import { normalizeSearch } from '../../services/search.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import {
  CATALOG_SORTS,
  catalogQuery,
  defaultCatalogFilters,
  filterCatalog,
  needsCatalogRatings,
  readCatalogFilters,
  selectGenre,
  type CatalogFilters as FilterState,
  type CatalogRatings,
} from '../../services/catalog-filters.js';
import { readCatalogView } from '../../services/content-preferences.js';
import { countLabel } from '../../core/format.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import {
  CatalogFilters,
  type FilterProps,
} from '../../components/catalog-filters/CatalogFilters.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { ViewToggle } from '../../components/view-toggle/ViewToggle.js';
import { StorageKey, writeJson } from '../../services/storage.js';

const template = await loadAssets({ template: templateSource });
type GenreType = 'all' | 'movie' | 'series';

/** Страница жанра сохраняет категорию при смене типа, года и сортировки. */
export class GenreCatalog extends Component<PageProps> {
  static template = template;
  #name: string;
  #type: GenreType;
  #state: FilterState;
  #films: Film[] = [];
  #ratings: CatalogRatings = new Map();
  #phase: 'loading' | 'ready' | 'error' = 'loading';
  #panel: CatalogFilters | null = null;
  #view: string;

  constructor(props: PageProps) {
    super(props);
    this.#name = (props.query.get('genre') || '').trim().slice(0, 100);
    this.#view =
      props.query.get('view') === 'list'
        ? 'list'
        : props.query.get('view') === 'grid'
          ? 'grid'
          : readCatalogView();
    const type = props.query.get('type');
    this.#type = type === 'movie' || type === 'series' ? type : 'all';
    this.#state = readCatalogFilters(props.query);
    if (!props.query.has('sort')) this.#state.sort = 'rating';
    this.#state.genres = {};
    this.#state.genreLabels = {};
    this.#state.allGenres = true;
    selectGenre(this.#state, this.#name, 1);
  }

  #results() {
    return filterCatalog(
      this.#films.filter((film) => this.#type === 'all' || film.type === this.#type),
      this.#state,
      this.#ratings,
    );
  }

  #href(type = this.#type, state = this.#state) {
    const query = catalogQuery(state);
    query.set('genre', this.#name);
    query.set('view', this.#view);
    if (type !== 'all') query.set('type', type);
    return `/genres?${query}`;
  }

  context() {
    const results = this.#results();
    const movies = results.filter((film) => !film.isSeries).length;
    const series = results.length - movies;
    const movieCount = countLabel(movies, ['фильм', 'фильма', 'фильмов']);
    const seriesCount = countLabel(series, ['сериал', 'сериала', 'сериалов']);
    return {
      name: this.#name,
      loading: this.#phase === 'loading',
      ready: this.#phase === 'ready',
      count:
        movies && series
          ? `${movieCount} · ${seriesCount}`
          : this.#type === 'series' || series
            ? seriesCount
            : movieCount,
      tabs: [
        { value: 'all', label: 'Всё' },
        { value: 'movie', label: 'Фильмы' },
        { value: 'series', label: 'Сериалы' },
      ].map((tab) => ({
        ...tab,
        href: this.#href(tab.value as GenreType),
        current: tab.value === this.#type ? 'page' : 'false',
      })),
      year:
        this.#state.yearFrom || this.#state.yearTo
          ? `${this.#state.yearFrom || '…'}–${this.#state.yearTo || '…'}`
          : 'Год',
      sort: CATALOG_SORTS.find((sort) => sort.value === this.#state.sort)?.label ?? 'По умолчанию',
    };
  }

  onRender() {
    document.title = `${this.#name} | Frame`;
    this.insert('heading', new SectionHeading({ title: this.#name, level: 1 }));
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
          title: 'Не удалось загрузить жанр',
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
    const films = this.#results();
    const content = this.insert(
      'feed',
      films.length
        ? new FilmFeed({
            films,
            heading: false,
            query: this.props.query,
            initialView: this.#view,
            onViewChange: (view) => {
              this.#view = view;
              history.replaceState(history.state, '', this.#href());
            },
            ratings: this.#ratings,
          })
        : new EmptyState({
            level: 2,
            title: 'Ничего не найдено',
            text: 'В этом жанре нет фильмов с выбранными параметрами.',
            button: 'Сбросить фильтры',
            onRetry: () => this.props.navigate(this.#href(this.#type, defaultCatalogFilters())),
          }),
    );
    this.insert(
      'view',
      new ViewToggle({
        view: this.#view,
        onChange: (view) => {
          this.#view = view;
          writeJson(StorageKey.CATALOG_VIEW, view);
          if (content instanceof FilmFeed) content.setView(view);
          history.replaceState(history.state, '', this.#href());
          for (const link of this.findAll<HTMLAnchorElement>('.genre-catalog__toolbar a')) {
            const target = new URL(link.href);
            target.searchParams.set('view', view);
            link.href = target.pathname + '?' + target.searchParams;
          }
        },
      }),
    );
    this.delegate('click', '[data-genre-filter]', (_, button) => {
      this.#panel?.destroy();
      this.#panel = new CatalogFilters({
        tab: button.dataset.genreFilter as FilterProps['tab'],
        singleSection: true,
        anchor: button,
        films: this.#films.filter((film) => this.#type === 'all' || film.type === this.#type),
        ratings: this.#ratings,
        genres: [this.#name],
        state: this.#state,
        onApply: (state) => this.props.navigate(this.#href(this.#type, state)),
      }).open();
    });
    if (this.props.restoreScroll != null) {
      const y = this.props.restoreScroll;
      const frame = requestAnimationFrame(() => window.scrollTo(0, y));
      this.watch(() => cancelAnimationFrame(frame));
    }
  }

  async #load(signal: AbortSignal) {
    try {
      const catalog = await loadCatalog({ signal });
      if (signal.aborted) return;
      const canonical = catalog
        .flatMap((film) => film.genres)
        .find((name) => normalizeSearch(name) === normalizeSearch(this.#name));
      if (canonical) this.#name = canonical;
      this.#films = catalog.filter((film) =>
        film.genres.some((name) => normalizeSearch(name) === normalizeSearch(this.#name)),
      );
      if (needsCatalogRatings(this.#state))
        this.#ratings = await loadCatalogRatings(this.#films, { signal });
      if (signal.aborted) return;
      this.#phase = 'ready';
    } catch {
      if (signal.aborted) return;
      this.#phase = 'error';
    }
    this.update();
  }

  destroy() {
    this.#panel?.destroy();
    super.destroy();
  }
}
