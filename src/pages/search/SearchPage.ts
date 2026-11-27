import './search-page.css';
import templateSource from './SearchPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';
import type { Film } from '../../api/films.js';
import type { Person } from '../../api/people.js';
import {
  clearSearchHistory,
  removeSearchHistory,
  searchHistory,
} from '../../services/search-history.js';
import {
  loadSearchData,
  matchesFilm,
  matchesPerson,
  readSearchTab,
  readSearchLibraryFilters,
  filterSearchLibrary,
  LIBRARY_PARAMS,
  type SearchLibraryFilters,
  type SearchTab,
  type ListFilter,
} from '../../services/search.js';
import {
  CATALOG_SORTS,
  catalogFilterCount,
  catalogFilterTags,
  catalogQuery,
  defaultCatalogFilters,
  filterCatalog,
  needsCatalogRatings,
  readCatalogFilters,
  type CatalogFilters as FilterState,
  type CatalogRatings,
} from '../../services/catalog-filters.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import { libraryLoaded, loadLibrary, readLibrary, watchLibrary } from '../../services/library.js';
import { readShelves, shelfFilmIds, watchShelves } from '../../services/shelves.js';
import { store } from '../../core/store.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { SearchField } from '../../components/search-field/SearchField.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { PersonCard } from '../../components/person-card/PersonCard.js';
import { ViewToggle } from '../../components/view-toggle/ViewToggle.js';
import {
  CatalogFilters,
  type FilterProps,
} from '../../components/catalog-filters/CatalogFilters.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { AdvancedSearchFilters } from './AdvancedSearchFilters.js';
import { loginPathHere } from '../../services/auth-return.js';
import { request } from '../../api/http.js';
import type { Profile } from '../../api/profile.js';

const template = await loadAssets({ template: templateSource });
const LIST_LABELS = {
  watched: 'Просмотренное',
  watchlater: 'Смотреть позже',
  favorite: 'Избранное',
};

/** Результаты, вкладки и фильтры восстанавливаются из URL без перезагрузки. */
export class SearchPage extends Component<PageProps> {
  static template = template;
  #query: string;
  #tab: SearchTab;
  #state: FilterState;
  #libraryState: SearchLibraryFilters;
  #rated: ListFilter;
  #shelf: string;
  #ratedIds = new Set<number>();
  #ratedLoaded = false;
  #films: Film[] = [];
  #people: Person[] = [];
  #ratings: CatalogRatings = new Map();
  #loading = true;
  #filmError = false;
  #peopleError = false;
  #fresh = false;
  #view: string;
  #filtersVisible: boolean;
  #panel: CatalogFilters | AdvancedSearchFilters | null = null;
  #feeds: FilmFeed[] = [];

  constructor(props: PageProps) {
    super(props);
    this.#query = (props.query.get('q') || '').trim().slice(0, 200);
    this.#tab = readSearchTab(props.query);
    this.#state = readCatalogFilters(props.query);
    this.#libraryState = readSearchLibraryFilters(props.query);
    const rated = props.query.get('inRated');
    this.#rated = rated === 'only' || rated === 'hide' ? rated : 'all';
    this.#shelf = props.query.get('shelf') || '';
    this.#view =
      (props.query.get('view') || readJson(StorageKey.CATALOG_VIEW, 'grid')) === 'list'
        ? 'list'
        : 'grid';
    this.#filtersVisible =
      props.query.get('filters') === '1' || this.#tab === 'movie' || this.#tab === 'series';
  }

  #results() {
    let films = this.#films.filter((film) => matchesFilm(film, this.#query));
    if (store.get('user')) films = filterSearchLibrary(films, this.#libraryState, readLibrary());
    films = this.#filterShelf(films);
    if (store.get('user') && this.#rated !== 'all')
      films = films.filter((film) =>
        this.#rated === 'only' ? this.#ratedIds.has(film.id) : !this.#ratedIds.has(film.id),
      );
    return this.#filmError ? [] : filterCatalog(films, this.#state, this.#ratings);
  }

  #hasSearch() {
    return Boolean(
      this.#query ||
      catalogFilterCount(this.#state) ||
      Object.values(this.#libraryState).some((value) => value !== 'all') ||
      this.#rated !== 'all' ||
      this.#shelf ||
      this.props.query.get('advanced') === '1',
    );
  }

  #href(
    tab = this.#tab,
    state = this.#state,
    library = this.#libraryState,
    rated = this.#rated,
    shelf = this.#shelf,
  ) {
    const query = catalogQuery(state);
    if (this.#query) query.set('q', this.#query);
    if (tab !== 'all') query.set('tab', tab);
    query.set('view', this.#view);
    Object.entries(LIBRARY_PARAMS).forEach(([key, param]) => {
      const value = library[key as keyof SearchLibraryFilters];
      if (value !== 'all') query.set(param, value);
    });
    if (this.#filtersVisible) query.set('filters', '1');
    if (rated !== 'all') query.set('inRated', rated);
    if (shelf) query.set('shelf', shelf);
    if (!this.#query) query.set('advanced', '1');
    return `/search?${query}`;
  }

  context() {
    const films = this.#results();
    const people = this.#people.filter((person) => matchesPerson(person, this.#query));
    const counts = {
      all:
        this.#filmError || this.#peopleError || this.#loading ? null : films.length + people.length,
      movie:
        this.#filmError || this.#loading ? null : films.filter((film) => !film.isSeries).length,
      series:
        this.#filmError || this.#loading ? null : films.filter((film) => film.isSeries).length,
      people: this.#peopleError || this.#loading ? null : people.length,
    };
    const tags = catalogFilterTags(this.#state, this.#genres());
    if (this.#shelf)
      tags.push({
        key: 'shelf',
        label:
          'Полка: ' +
          (readShelves().find((shelf) => shelf.id === this.#shelf)?.name ??
            'недоступна на этом устройстве'),
        excluded: false,
      });
    if (store.get('user'))
      Object.entries(this.#libraryState).forEach(([key, mode]) => {
        if (mode !== 'all')
          tags.push({
            key: `library:${key}`,
            label: `${LIST_LABELS[key as keyof SearchLibraryFilters]}: ${mode === 'hide' ? 'скрыть' : 'только'}`,
            excluded: mode === 'hide',
          });
      });
    if (store.get('user') && this.#rated !== 'all')
      tags.push({
        key: 'rated',
        label: `С моей оценкой: ${this.#rated === 'only' ? 'только' : 'скрыть'}`,
        excluded: this.#rated === 'hide',
      });
    return {
      query: this.#query,
      wheelHref:
        this.#tab !== 'people' && films.length
          ? '/wheel?' +
            new URLSearchParams({
              pool: films
                .filter((film) =>
                  this.#tab === 'movie'
                    ? !film.isSeries
                    : this.#tab === 'series'
                      ? film.isSeries
                      : true,
                )
                .slice(0, 100)
                .map((film) => film.id)
                .join(','),
            })
          : '',
      history: searchHistory(),
      hasSearch: this.#hasSearch(),
      loading: this.#loading,
      needsLogin:
        this.#tab !== 'people' &&
        !store.get('user') &&
        (this.#rated !== 'all' ||
          this.#shelf ||
          Object.values(this.#libraryState).some((value) => value !== 'all')),
      loginHref: loginPathHere(),
      tabs: [
        { value: 'all', label: 'Всё' },
        { value: 'movie', label: 'Фильмы' },
        { value: 'series', label: 'Сериалы' },
        { value: 'people', label: 'Люди' },
      ].map((tab) => ({
        ...tab,
        href: this.#href(tab.value as SearchTab),
        count: counts[tab.value as keyof typeof counts],
        current: this.#tab === tab.value ? 'page' : 'false',
      })),
      total: counts[this.#tab],
      partial: this.#filmError || this.#peopleError,
      filmError: this.#filmError && this.#tab !== 'people',
      peopleError: this.#peopleError && ['people', 'all'].includes(this.#tab),
      showPeople:
        !this.#loading &&
        ['people', 'all'].includes(this.#tab) &&
        (people.length > 0 || this.#tab === 'people'),
      showFilms: !this.#loading && !this.#filmError && this.#tab !== 'people' && films.length > 0,
      empty:
        !this.#loading &&
        counts[this.#tab] === 0 &&
        (this.#tab === 'people' ? !this.#peopleError : !this.#filmError),
      allTab: this.#tab === 'all',
      peopleTab: this.#tab === 'people',
      peopleHref: this.#href('people'),
      moviesHref: this.#href('movie'),
      seriesHref: this.#href('series'),
      morePeople: this.#tab === 'all' && people.length > 2,
      tags: this.#tab === 'people' ? [] : tags,
      activeCount: tags.length,
      filterPanel: this.#filtersVisible && this.#tab !== 'people',
      layoutClass:
        this.#filtersVisible && this.#tab !== 'people' ? 'search-page__layout--filters' : '',
      sortLabel:
        CATALOG_SORTS.find((sort) => sort.value === this.#state.sort)?.label ?? 'По умолчанию',
      filterRows: [
        { tab: 'genres', label: 'Жанры', value: 'Выбрать' },
        {
          tab: 'year',
          label: 'Год',
          value:
            this.#state.yearFrom || this.#state.yearTo
              ? `${this.#state.yearFrom || '…'}–${this.#state.yearTo || '…'}`
              : 'Все',
        },
        {
          tab: 'rating',
          label: 'Рейтинг',
          value: this.#state.ratingFrom ? `от ${this.#state.ratingFrom}` : 'Все',
        },
        {
          tab: 'age',
          label: 'Возраст',
          value: this.#state.ages.length
            ? this.#state.ages.map((age) => `${age}+`).join(', ')
            : 'Все',
        },
        {
          tab: 'sort',
          label: 'Сортировка',
          value: CATALOG_SORTS.find((sort) => sort.value === this.#state.sort)?.label,
        },
      ],
    };
  }

  onRender() {
    document.title = this.#query ? `Поиск: ${this.#query} | Frame` : 'Поиск | Frame';
    this.insert('heading', new SectionHeading({ title: 'Поиск', level: 1 }));
    this.insert('search', new SearchField({ navigate: this.props.navigate }));
    this.#feeds = [];
    this.delegate('click', '[data-clear-history]', () => {
      clearSearchHistory();
      this.update();
    });
    this.delegate('click', '[data-remove-history]', (_, button) => {
      removeSearchHistory(button.dataset.removeHistory!);
      this.update();
    });
    this.delegate('click', '[data-start-advanced]', () =>
      this.props.navigate('/search?advanced=1&filters=1'),
    );
    if (!this.#hasSearch()) return;
    if (this.#loading) {
      this.insert('loading', new Skeleton({ variant: 'catalog' }));
      const controller = new AbortController();
      this.watch(() => controller.abort());
      void this.#load(controller.signal);
      return;
    }
    const films = this.#results();
    const people = this.#people.filter((person) => matchesPerson(person, this.#query));
    if (this.#tab !== 'people')
      this.insert(
        'view',
        new ViewToggle({ view: this.#view, onChange: (view) => this.#setView(view) }),
      );
    const peopleGrid = this.query('.search-page__people-grid');
    if (peopleGrid)
      (this.#tab === 'all' ? people.slice(0, 2) : people).forEach((person) =>
        this.insert(peopleGrid, new PersonCard(person)),
      );
    if (!this.#filmError && this.#tab !== 'people' && films.length) {
      if (this.#tab === 'all') {
        this.#addFeed('movies', films.filter((film) => !film.isSeries).slice(0, 5));
        this.#addFeed('series', films.filter((film) => film.isSeries).slice(0, 5));
      } else
        this.#addFeed(
          'films',
          films.filter((film) => (this.#tab === 'movie' ? !film.isSeries : film.isSeries)),
        );
    }
    this.delegate('click', '[data-retry]', () => {
      this.#fresh = true;
      this.#loading = true;
      this.update();
    });
    this.delegate('click', '[data-filter-tab]', (_, button) =>
      this.#openFilters(button.dataset.filterTab as FilterProps['tab'], button),
    );
    this.delegate('click', '[data-toggle-filters]', (_, button) => {
      if (matchMedia('(max-width: 767px)').matches) this.#openFilters('all', button);
      else {
        this.#filtersVisible = !this.#filtersVisible;
        this.update();
        this.query('[data-toggle-filters]')?.focus({ preventScroll: true });
      }
    });
    this.delegate('click', '[data-clear]', () =>
      this.props.navigate(
        this.#href(
          this.#tab,
          defaultCatalogFilters(),
          {
            watched: 'all',
            watchlater: 'all',
            favorite: 'all',
          },
          'all',
        ),
      ),
    );
    this.delegate('click', '[data-remove-filter]', (_, button) =>
      this.#removeFilter(button.dataset.removeFilter!),
    );
    this.delegate('click', '[data-advanced]', () => {
      this.#panel?.destroy();
      this.#panel = new AdvancedSearchFilters({
        state: this.#libraryState,
        rated: this.#rated,
        ratedCount: this.#ratedLoaded ? this.#ratedIds.size : null,
        shelf: this.#shelf,
        onApply: (state, rated, shelf) =>
          this.props.navigate(this.#href(this.#tab, this.#state, state, rated, shelf)),
      }).open();
    });
    this.watch(watchLibrary(() => this.update()));
    this.watch(watchShelves(() => this.update()));
    if (this.props.restoreScroll != null) {
      const y = this.props.restoreScroll;
      const frame = requestAnimationFrame(() => window.scrollTo(0, y));
      this.watch(() => cancelAnimationFrame(frame));
    }
  }

  #addFeed(slot: string, films: Film[]) {
    const host = this.query(`[data-slot="${slot}"]`);
    if (!host) return;
    if (!films.length) {
      host.closest('section')?.remove();
      return;
    }
    this.#feeds.push(
      this.insert(
        slot,
        new FilmFeed({
          films,
          heading: false,
          query: this.props.query,
          initialView: this.#view,
          ratings: this.#ratings,
        }),
      ),
    );
  }

  async #load(signal: AbortSignal) {
    try {
      const data = await loadSearchData({ signal, fresh: this.#fresh });
      if (signal.aborted) return;
      this.#films = data.films;
      this.#people = data.people;
      this.#filmError = data.filmError;
      this.#peopleError = data.peopleError;
      const owner = store.get('user')?.id;
      if (owner && Object.values(this.#libraryState).some((value) => value !== 'all')) {
        try {
          if (!libraryLoaded()) await loadLibrary();
        } catch {
          if (!signal.aborted) this.#filmError = true;
        }
        if (signal.aborted || store.get('user')?.id !== owner) return;
      }
      if (!this.#filmError && owner && this.#rated !== 'all') {
        try {
          const profile = await request<Profile>('/me/profile', { signal });
          if (signal.aborted || store.get('user')?.id !== owner) return;
          this.#ratedIds = new Set(
            profile.ratings
              .filter(
                (film) => typeof film.score === 'number' && film.score >= 1 && film.score <= 10,
              )
              .map((film) => film.id),
          );
          this.#ratedLoaded = true;
        } catch {
          if (!signal.aborted) this.#filmError = true;
        }
      }
      if (!this.#filmError && needsCatalogRatings(this.#state)) {
        try {
          this.#ratings = await loadCatalogRatings(
            this.#films.filter((film) => matchesFilm(film, this.#query)),
            { signal },
          );
        } catch {
          if (!signal.aborted) this.#filmError = true;
        }
      }
      if (signal.aborted) return;
      this.#loading = false;
      this.update();
    } catch {
      if (!signal.aborted) {
        this.#filmError = true;
        this.#peopleError = true;
        this.#loading = false;
        this.update();
      }
    }
  }

  #genres() {
    return [...new Set(this.#films.flatMap((film) => film.genres))].sort((a, b) =>
      a.localeCompare(b, 'ru'),
    );
  }

  #openFilters(tab: FilterProps['tab'], anchor: HTMLElement) {
    this.#panel?.destroy();
    let candidates = this.#films.filter(
      (film) =>
        matchesFilm(film, this.#query) &&
        (this.#tab === 'movie' ? !film.isSeries : this.#tab === 'series' ? film.isSeries : true),
    );
    if (store.get('user'))
      candidates = filterSearchLibrary(candidates, this.#libraryState, readLibrary());
    candidates = this.#filterShelf(candidates);
    if (store.get('user') && this.#rated !== 'all')
      candidates = candidates.filter((film) =>
        this.#rated === 'only' ? this.#ratedIds.has(film.id) : !this.#ratedIds.has(film.id),
      );
    this.#panel = new CatalogFilters({
      tab,
      anchor,
      state: this.#state,
      films: candidates,
      ratings: this.#ratings,
      genres: this.#genres(),
      onApply: (state) => this.props.navigate(this.#href(this.#tab, state)),
    }).open();
  }

  #removeFilter(key: string) {
    const state = structuredClone(this.#state);
    const library = { ...this.#libraryState };
    if (key.startsWith('genre:')) delete state.genres[key.slice(6)];
    if (key.startsWith('library:')) library[key.slice(8) as keyof SearchLibraryFilters] = 'all';
    if (key === 'year') {
      state.yearFrom = '';
      state.yearTo = '';
    }
    if (key === 'rating') state.ratingFrom = 0;
    if (key === 'artistic') state.allGenres = false;
    if (key.startsWith('age:'))
      state.ages = state.ages.filter((age) => age !== Number(key.slice(4)));
    this.props.navigate(
      this.#href(
        this.#tab,
        state,
        library,
        key === 'rated' ? 'all' : this.#rated,
        key === 'shelf' ? '' : this.#shelf,
      ),
    );
  }

  #setView(view: string) {
    this.#view = view;
    writeJson(StorageKey.CATALOG_VIEW, view);
    this.#feeds.forEach((feed) => feed.grid?.setView(view));
    const query = new URLSearchParams(location.search);
    query.set('view', view);
    history.replaceState(history.state, '', `${location.pathname}?${query}`);
    this.findAll<HTMLAnchorElement>('a[href^="/search?"]').forEach((link) => {
      const target = new URL(link.href);
      target.searchParams.set('view', view);
      link.setAttribute('href', `${target.pathname}?${target.searchParams}`);
    });
  }

  #filterShelf(films: Film[]) {
    if (!this.#shelf || !store.get('user')) return films;
    const shelf = readShelves().find((item) => item.id === this.#shelf);
    const ids = new Set(shelf ? shelfFilmIds(shelf, readLibrary().favorite) : []);
    return films.filter((film) => ids.has(film.id));
  }

  destroy() {
    this.#panel?.destroy();
    super.destroy();
  }
}
