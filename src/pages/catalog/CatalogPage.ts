import './catalog-page.css';
import templateSource from './CatalogPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { Film } from '../../api/films.js';
import { ApiError } from '../../api/http.js';
import { countLabel } from '../../core/format.js';
import { loadCatalog } from '../../services/catalog.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import {
  CATALOG_SORTS,
  catalogFilterCount,
  catalogFilterTags,
  catalogQuery,
  defaultCatalogFilters,
  filterCatalog,
  genreSelection,
  needsCatalogRatings,
  readCatalogFilters,
  selectGenre,
  type CatalogFilters as FilterState,
  type CatalogRatings,
} from '../../services/catalog-filters.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { ViewToggle } from '../../components/view-toggle/ViewToggle.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import {
  CatalogFilters,
  type FilterProps,
} from '../../components/catalog-filters/CatalogFilters.js';
import type { PageProps } from '../../app/router.js';
import { readContentPreferences } from '../../services/content-preferences.js';
import { visibleContent } from '../../services/content-preferences.js';
import { CatalogPager } from '../../services/catalog-pager.js';
import { notify } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });
const snapshots = new Map<string, number>();
const SECTIONS = {
  movie: {
    title: 'Фильмы',
    note: 'Большие истории для вашего экрана.',
    forms: ['фильм', 'фильма', 'фильмов'],
    unit: 'ФИЛЬМОВ',
    empty: 'В каталоге пока пусто',
    emptyNote: 'Мы уже добавляем новые фильмы — загляните чуть позже.',
  },
  series: {
    title: 'Сериалы',
    note: 'Истории, с которыми хочется остаться подольше.',
    forms: ['сериал', 'сериала', 'сериалов'],
    unit: 'СЕРИАЛОВ',
    empty: 'Сериалов пока нет',
    emptyNote: 'Скоро добавим новые сезоны — загляните чуть позже.',
  },
};
const GENRE_ORDER = [
  'драма',
  'комедия',
  'мелодрама',
  'семейный',
  'детский',
  'мюзикл',
  'музыка',
  'боевик',
  'триллер',
  'криминал',
  'детектив',
  'нуар',
  'вестерн',
  'военный',
  'фантастика',
  'фэнтези',
  'приключения',
  'ужасы',
  'мистика',
  'мультфильм',
  'аниме',
  'биография',
  'история',
  'спорт',
];

/** Каталог с состоянием фильтров в URL и восстановлением загруженных карточек. */
export class CatalogPage extends Component<PageProps> {
  static template = template;
  #phase: 'loading' | 'ready' | 'empty' | 'error' = 'loading';
  #state: FilterState;
  #films: Film[] = [];
  #results: Film[] = [];
  #ratings: CatalogRatings = new Map();
  #panel: CatalogFilters | null = null;
  #feed!: FilmFeed;
  #view: string;
  #fresh = false;
  #error: unknown;
  #key: string;
  #visible = 20;
  #ratingController = new AbortController();
  #wantedRatings = new Set<number>();
  #pager: CatalogPager | undefined;
  #filtersRequest: AbortController | null = null;
  #filtersAnchor: HTMLElement | null = null;
  #top = false;
  #ratingQueue = Promise.resolve();

  constructor(props: PageProps) {
    super(props);
    this.#state = readCatalogFilters(props.query);
    if (!props.query.has('sort')) this.#state.sort = readContentPreferences().sort;
    this.#top = props.query.get('top') === '250';
    if (this.#top) this.#state.sort = 'rating';
    const view = props.query.get('view') || readJson(StorageKey.CATALOG_VIEW, 'grid');
    this.#view = view === 'list' ? 'list' : 'grid';
    this.#key = `${props.type}?${catalogQuery(this.#state)}${this.#top ? '&top=250' : ''}`;
    this.#visible = snapshots.get(this.#key) || 20;
  }

  context() {
    const section = this.#section();
    const tags = catalogFilterTags(this.#state, this.#genres());
    return {
      ...section,
      ready: this.#phase === 'ready',
      phase: this.#phase,
      failed: this.#phase === 'error',
      count: this.#count(),
      activeCount: catalogFilterCount(this.#state),
      tags,
      sortLabel:
        CATALOG_SORTS.find((sort) => sort.value === this.#state.sort)?.label || 'По умолчанию',
      yearLabel:
        this.#state.yearFrom || this.#state.yearTo
          ? `${this.#state.yearFrom || '…'}–${this.#state.yearTo || '…'}`
          : 'Год',
      ratingLabel: this.#state.ratingFrom
        ? `от ${this.#state.ratingFrom.toLocaleString('ru')}`
        : 'Рейтинг',
      ageLabel: this.#state.ages.length
        ? this.#state.ages.map((age) => `${age}+`).join(', ')
        : 'Возраст',
      quickGenres: this.#genres()
        .slice(0, 8)
        .map((name) => ({ name, active: genreSelection(this.#state, name) === 1 })),
      noGenres: !Object.values(this.#state.genres).some((value) => value !== 0),
    };
  }

  onRender() {
    const section = this.#section();
    document.title = `${section.title} | Frame`;
    if (this.#phase === 'loading') {
      this.insert('state', new Skeleton({ variant: 'catalog' }));
      const controller = new AbortController();
      this.watch(() => controller.abort());
      void this.#load(controller.signal);
      return;
    }
    if (this.#phase === 'error') {
      this.insert('error-skeleton', new Skeleton({ variant: 'catalog' }));
      this.insert(
        'state',
        new EmptyState({
          variant: 'error',
          requestError: true,
          title:
            needsCatalogRatings(this.#state) && this.#films.length
              ? 'Не удалось загрузить рейтинги'
              : `Не удалось загрузить ${this.props.type === 'movie' ? 'фильмы' : 'сериалы'}`,
          text: 'Проверьте соединение и попробуйте ещё раз — фильтры сохранятся.',
          button: 'Повторить',
          homeLink: true,
          code: this.#error instanceof ApiError ? this.#error.status : '',
          onRetry: () => this.#retry(),
        }),
      );
      this.on('online', () => this.#retry(), window);
      return;
    }
    if (this.#phase === 'empty') {
      this.insert(
        'state',
        new EmptyState({
          variant: this.props.type,
          title: section.empty,
          text: section.emptyNote,
          unit: section.unit,
        }),
      );
      return;
    }

    this.insert('heading', new SectionHeading({ title: section.title, level: 1 }));
    this.insert(
      'view',
      new ViewToggle({ view: this.#view, onChange: (view) => this.#setView(view) }),
    );
    if (this.#results.length) {
      this.#feed = this.insert(
        'feed',
        new FilmFeed({
          films: this.#results,
          pager: this.#pager,
          accept: (film) => film.type === this.props.type,
          onFilmsChange: (films) => {
            this.#films = films;
            this.#results = films;
            this.find('[data-catalog-count]').textContent = this.#count();
          },
          title: section.title,
          heading: false,
          infinite: true,
          initialView: this.#view,
          initialVisible: this.#visible,
          ratings: this.#ratings,
          endLabel: 'Вы посмотрели всё',
          floatingTop: true,
          query: this.props.query,
          onVisibleChange: (visible) => {
            this.#visible = visible;
            this.#saveVisible();
            this.#loadVisibleRatings();
          },
        }),
      );
    } else
      this.insert(
        'feed',
        new EmptyState({
          variant: this.props.type,
          level: 2,
          unit: section.unit,
          title: 'Ничего не найдено',
          text: 'Попробуйте изменить фильтры или сбросить ограничения.',
          button: 'Сбросить фильтры',
          onRetry: () => this.#apply(defaultCatalogFilters()),
        }),
      );
    this.delegate('click', '[data-filter-tab]', (event, button) =>
      this.#openFilters(button.dataset.filterTab, button),
    );
    this.delegate('click', '[data-clear]', () => this.#apply(defaultCatalogFilters()));
    this.delegate('click', '[data-remove-filter]', (event, button) =>
      this.#removeFilter(button.dataset.removeFilter),
    );
    this.delegate('click', '[data-quick-genre]', (event, button) => {
      const genre = button.dataset.quickGenre;
      if (!genre) return;
      const state = structuredClone(this.#state);
      selectGenre(state, genre, genreSelection(state, genre) === 1 ? 0 : 1);
      this.#apply(state);
    });
    this.delegate('click', '[data-all-genres]', () => {
      const state = structuredClone(this.#state);
      state.genres = {};
      state.allGenres = false;
      this.#apply(state);
    });
    this.watch(() => {
      this.#ratingController.abort();
      this.#panel?.destroy();
      this.#saveVisible();
    });
    this.on(
      'resize',
      () => {
        if (matchMedia('(max-width: 767px)').matches) this.#loadVisibleRatings();
      },
      window,
    );
    if (this.props.restoreScroll != null) {
      const scrollY = this.props.restoreScroll;
      const frame = requestAnimationFrame(() => window.scrollTo(0, scrollY));
      this.watch(() => cancelAnimationFrame(frame));
    }
  }

  async #load(signal: AbortSignal) {
    try {
      const paged = catalogFilterCount(this.#state) === 0 && this.#state.sort === 'catalog';
      let films: Film[];
      if (paged) {
        this.#pager = new CatalogPager({ fresh: this.#fresh });
        await this.#pager.loadTo(
          this.#visible,
          (items) => visibleContent(items).filter((film) => film.type === this.props.type),
          signal,
        );
        films = visibleContent(this.#pager.films);
      } else films = await loadCatalog({ fresh: this.#fresh, signal });
      if (signal.aborted) return;
      this.#films = films.filter((film) => film.type === this.props.type);
      if (needsCatalogRatings(this.#state))
        this.#ratings = await loadCatalogRatings(this.#films, { signal });
      if (signal.aborted) return;
      this.#results = filterCatalog(this.#films, this.#state, this.#ratings);
      if (this.#top)
        this.#results = this.#results
          .filter((film) => (this.#ratings.get(film.id)?.votes ?? 0) > 0)
          .slice(0, 250);
      this.#phase =
        this.#films.length || catalogFilterCount(this.#state) || this.#top ? 'ready' : 'empty';
    } catch (error) {
      if (signal.aborted) return;
      this.#error = error;
      this.#phase = 'error';
    }
    this.update();
  }

  #genres(): string[] {
    return [...new Set(this.#films.flatMap((film) => film.genres))].sort((a, b) => {
      const rank = (name: string) => {
        const index = GENRE_ORDER.indexOf(name.toLocaleLowerCase('ru'));
        return index < 0 ? GENRE_ORDER.length : index;
      };
      return rank(a) - rank(b) || a.localeCompare(b, 'ru');
    });
  }

  async #openFilters(tab: string | undefined, anchor: HTMLElement) {
    if (!tab || !['genres', 'year', 'rating', 'age', 'sort', 'all'].includes(tab)) return;
    this.#panel?.destroy();
    this.#filtersRequest?.abort();
    this.#filtersAnchor?.setAttribute('aria-busy', 'false');
    const controller = new AbortController();
    this.#filtersRequest = controller;
    this.#filtersAnchor = anchor;
    this.watch(() => controller.abort());
    anchor.setAttribute('aria-busy', 'true');
    let films = this.#films;
    try {
      if (this.#pager && !this.#pager.complete)
        films = (await loadCatalog({ signal: controller.signal })).filter(
          (film) => film.type === this.props.type,
        );
      if (controller.signal.aborted) return;
    } catch {
      if (!controller.signal.aborted) {
        anchor.setAttribute('aria-busy', 'false');
        notify('Не удалось загрузить варианты фильтра. Нажмите ещё раз, чтобы повторить.', {
          type: 'error',
        });
      }
      return;
    }
    anchor.setAttribute('aria-busy', 'false');
    anchor.setAttribute('aria-expanded', 'true');
    this.#panel = new CatalogFilters({
      tab: tab as FilterProps['tab'],
      anchor,
      state: this.#state,
      films,
      ratings: this.#ratings,
      genres: [...new Set(films.flatMap((film) => film.genres))].sort((a, b) =>
        a.localeCompare(b, 'ru'),
      ),
      onApply: (state) => this.#apply(state),
      onClose: () => {
        anchor.setAttribute('aria-expanded', 'false');
        this.#panel = null;
      },
    }).open();
  }

  #apply(state: FilterState) {
    const query = catalogQuery(state);
    if (this.#top && state.sort === 'rating') query.set('top', '250');
    query.set('view', this.#view);
    this.props.navigate(`${this.props.type === 'series' ? '/series' : '/films'}?${query}`);
  }

  #removeFilter(key: string | undefined) {
    if (!key) return;
    const state = structuredClone(this.#state);
    if (key.startsWith('genre:')) delete state.genres[key.slice(6)];
    if (key === 'artistic') state.allGenres = false;
    if (key.startsWith('age:'))
      state.ages = state.ages.filter((age) => age !== Number(key.slice(4)));
    if (key === 'year') {
      state.yearFrom = '';
      state.yearTo = '';
    }
    if (key === 'rating') state.ratingFrom = 0;
    this.#apply(state);
  }

  #setView(view: string) {
    this.#view = view;
    writeJson(StorageKey.CATALOG_VIEW, view);
    this.#feed?.setView(view);
    const query = new URLSearchParams(location.search);
    query.set('view', view);
    history.replaceState(history.state, '', `${location.pathname}?${query}`);
  }

  #retry() {
    this.#fresh = true;
    this.#phase = 'loading';
    this.update();
  }

  #count() {
    const section = SECTIONS[this.props.type || 'movie'];
    const count = countLabel(this.#films.length, section.forms);
    if (this.#pager?.complete === false) return `Загружено: ${count}`;
    return `${this.#results.length !== this.#films.length ? `${this.#results.length} из ` : ''}${count}`;
  }

  #section() {
    const section = SECTIONS[this.props.type || 'movie'];
    return this.#top
      ? {
          ...section,
          title: 'Топ-250 Frame',
          note: 'Фильмы каталога с наибольшей средней оценкой пользователей Frame.',
        }
      : section;
  }

  #saveVisible() {
    snapshots.delete(this.#key);
    snapshots.set(this.#key, this.#visible);
    const oldest = snapshots.keys().next().value;
    if (snapshots.size > 10 && oldest !== undefined) snapshots.delete(oldest);
  }

  #loadVisibleRatings() {
    const films = this.#results
      .slice(0, this.#visible)
      .filter((film) => !this.#ratings.has(film.id) && !this.#wantedRatings.has(film.id));
    if (!films.length) return;
    films.forEach((film) => this.#wantedRatings.add(film.id));
    this.#ratingQueue = this.#ratingQueue.then(async () => {
      if (this.#ratingController.signal.aborted) return;
      try {
        const ratings = await loadCatalogRatings(films, { signal: this.#ratingController.signal });
        if (this.#ratingController.signal.aborted) return;
        ratings.forEach((rating, id) => this.#ratings.set(id, rating));
        this.#feed?.grid.setRatings(this.#ratings);
      } catch {
        films.forEach((film) => this.#wantedRatings.delete(film.id));
      }
    });
  }
}
