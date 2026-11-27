import './catalog-filters.css';
import templateSource from './CatalogFilters.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import {
  CATALOG_AGES,
  CATALOG_SORTS,
  catalogYearError,
  defaultCatalogFilters,
  filterCatalog,
  genreSelection,
  needsCatalogRatings,
  selectGenre,
  type CatalogFilters as FilterState,
  type CatalogRatings,
} from '../../services/catalog-filters.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import type { Film } from '../../api/films.js';

export interface FilterProps {
  state: FilterState;
  ratings?: CatalogRatings;
  films: Film[];
  genres: string[];
  tab: keyof typeof TITLES;
  singleSection?: boolean;
  anchor?: HTMLElement;
  onApply(state: FilterState): void;
  onClose?: () => void;
}

const template = await loadAssets({ template: templateSource });
const TITLES = {
  genres: 'Жанры',
  year: 'Год выпуска',
  rating: 'Рейтинг',
  age: 'Возраст',
  sort: 'Сортировка',
  all: 'Фильтры',
};

/** Поповер на десктопе и модальная шторка на мобильном экране. */
export class CatalogFilters extends Component<FilterProps> {
  static template = template;
  declare element: HTMLDialogElement;
  #draft: FilterState;
  #ratings: CatalogRatings;
  #ratingStatus: 'idle' | 'loading' | 'ready' | 'error';
  #controller = new AbortController();
  #closed = false;
  #opened = false;
  #overflow = '';
  #genreOptionsOpen = false;

  constructor(props: FilterProps) {
    super(props);
    this.#draft = structuredClone(props.state);
    this.#ratings = props.ratings || new Map();
    this.#ratingStatus = props.films.every((film) => this.#ratings.has(film.id)) ? 'ready' : 'idle';
  }

  context() {
    const years = this.props.films
      .map((film) => film.year)
      .filter((year) => Number.isInteger(year) && year > 0);
    const yearMin = Math.min(1900, ...years);
    const yearMax = Math.max(new Date().getFullYear(), ...years);
    const error = catalogYearError(this.#draft);
    const waiting = needsCatalogRatings(this.#draft) && this.#ratingStatus !== 'ready';
    const count =
      error || waiting ? null : filterCatalog(this.props.films, this.#draft, this.#ratings).length;
    return {
      ...this.#draft,
      yearMin,
      yearMax,
      yearLow: Number(this.#draft.yearFrom) || yearMin,
      yearHigh: Number(this.#draft.yearTo) || yearMax,
      decades: Array.from({ length: Math.floor((yearMax - 1950) / 10) + 1 }, (_, index) => ({
        start: 1950 + index * 10,
        label: 1950 + index * 10 + '-е',
      })),
      title:
        matchMedia('(max-width: 767px)').matches && this.props.tab !== 'sort'
          ? 'Фильтры'
          : TITLES[this.props.tab],
      genres: this.props.genres.map((name) => {
        const selected = genreSelection(this.#draft, name);
        return {
          name,
          state: selected === 1 ? 'include' : selected === -1 ? 'exclude' : 'neutral',
          checked: selected === -1 ? 'mixed' : String(selected === 1),
          ariaLabel: `${name}, ${selected === -1 ? 'исключено' : selected === 1 ? 'включено' : 'не выбрано'}`,
        };
      }),
      ages: CATALOG_AGES.map((age) => ({ age, active: this.#draft.ages.includes(age) })),
      sorts: CATALOG_SORTS.map((sort) => ({ ...sort, active: this.#draft.sort === sort.value })),
      error,
      invalid: Boolean(error) || waiting,
      count,
      pending: count === null,
      artistic: !this.#draft.allGenres,
      loadingRatings: this.#ratingStatus === 'loading',
      ratingError: this.#ratingStatus === 'error',
      ratingLabel: this.#draft.ratingFrom.toLocaleString('ru'),
      ratingPercent: this.#draft.ratingFrom * 10,
    };
  }

  open() {
    document.body.append(this.render());
    this.#overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.#opened = true;
    this.element.showModal();
    if (!matchMedia('(max-width: 767px)').matches) this.#position();
    return this;
  }

  onRender() {
    this.element.dataset.tab = this.props.tab;
    this.element.dataset.singleSection = String(Boolean(this.props.singleSection));
    this.on('cancel', (event) => {
      event.preventDefault();
      this.close();
    });
    this.on(
      'toggle',
      (event) => {
        if (event.target instanceof HTMLDetailsElement && matchMedia('(max-width: 767px)').matches)
          this.#genreOptionsOpen = event.target.open;
      },
      this.element,
      true,
    );
    this.on('close', () => this.destroy());
    this.on('click', (event) => {
      if (event.target !== this.element) return;
      const rect = this.element.getBoundingClientRect();
      const pointer = event as MouseEvent;
      if (
        pointer.clientX < rect.left ||
        pointer.clientX > rect.right ||
        pointer.clientY < rect.top ||
        pointer.clientY > rect.bottom
      )
        this.close();
    });
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-reset]', () => {
      const tab = this.props.tab;
      if (tab === 'sort') this.#draft.sort = 'catalog';
      else if (tab === 'all' || matchMedia('(max-width: 767px)').matches)
        this.#draft = defaultCatalogFilters();
      else if (tab === 'genres') {
        this.#draft.genres = {};
        this.#draft.anyGenre = false;
        this.#draft.allGenres = false;
      } else if (tab === 'year') {
        this.#draft.yearFrom = '';
        this.#draft.yearTo = '';
      } else if (tab === 'rating') this.#draft.ratingFrom = 0;
      else if (tab === 'age') this.#draft.ages = [];
      this.#refresh();
    });
    this.delegate('click', '[data-reset-genres]', () => {
      this.#draft.genres = {};
      this.#draft.anyGenre = false;
      this.#draft.allGenres = false;
      this.#refresh();
    });
    this.delegate('click', '[data-genre]', (event, button) => {
      const name = button.dataset.genre;
      if (!name) return;
      const current = genreSelection(this.#draft, name);
      const action = button.dataset.action;
      const selection =
        action === 'include'
          ? current === 1
            ? 0
            : 1
          : action === 'exclude'
            ? current === -1
              ? 0
              : -1
            : current === 0
              ? 1
              : current === 1
                ? -1
                : 0;
      selectGenre(this.#draft, name, selection);
      this.#refresh();
    });
    this.delegate('click', '[data-age]', (event, button) => {
      const age = Number(button.dataset.age);
      this.#draft.ages = this.#draft.ages.includes(age)
        ? this.#draft.ages.filter((value) => value !== age)
        : [...this.#draft.ages, age];
      this.#refresh();
    });
    this.delegate('click', '[data-sort]', (event, button) => {
      this.#draft.sort = button.dataset.sort as FilterState['sort'];
      this.#refresh();
      this.#ensureRatings();
    });
    this.delegate('click', '[data-rating]', (event, button) => {
      this.#draft.ratingFrom = Number(button.dataset.rating);
      this.#refresh();
      this.#ensureRatings();
    });
    this.delegate('click', '[data-retry-ratings]', () => void this.#loadRatings());
    this.delegate('click', '[data-decade]', (_, button) => {
      const year = Number(button.dataset.decade);
      this.#draft.yearFrom = String(year);
      this.#draft.yearTo = String(year + 9);
      this.#refresh();
    });
    this.on('input', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.name === 'yearFromRange' || input.name === 'yearToRange') {
        const from = this.find<HTMLInputElement>('[name=yearFromRange]');
        const to = this.find<HTMLInputElement>('[name=yearToRange]');
        if (Number(from.value) > Number(to.value)) {
          if (input === from) to.value = from.value;
          else from.value = to.value;
        }
        this.#draft.yearFrom = from.value;
        this.#draft.yearTo = to.value;
        this.find<HTMLInputElement>('[name=yearFrom]').value = from.value;
        this.find<HTMLInputElement>('[name=yearTo]').value = to.value;
      }
      if (input.name === 'yearFrom' || input.name === 'yearTo')
        this.#draft[input.name] = input.value;
      if (input.name === 'ratingFrom') {
        this.#draft.ratingFrom = Number(input.value);
        input.style.setProperty('--rating-percent', `${this.#draft.ratingFrom * 10}%`);
        this.find('[data-rating-label]').textContent = this.#draft.ratingFrom.toLocaleString('ru');
        this.#ensureRatings();
      }
      this.#updateCount();
    });
    this.on('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.name === 'anyGenre') this.#draft.anyGenre = input.checked;
      if (input.name === 'artistic') {
        this.#draft.allGenres = !input.checked;
        this.#refresh();
      }
      this.#updateCount();
    });
    this.on('submit', (event) => {
      event.preventDefault();
      if (this.context().invalid) return;
      this.props.onApply(structuredClone(this.#draft));
      this.close();
    });
    let start = 0;
    this.delegate('pointerdown', '[data-handle]', (event, handle) => {
      start = (event as PointerEvent).clientY;
      handle.setPointerCapture((event as PointerEvent).pointerId);
    });
    this.delegate('pointerup', '[data-handle]', (event) => {
      if ((event as PointerEvent).clientY - start > 72) this.close();
    });
    this.on(
      'resize',
      () => {
        if (!matchMedia('(max-width: 767px)').matches) this.#position();
        else {
          this.element.style.removeProperty('top');
          this.element.style.removeProperty('left');
        }
        this.#syncInputs();
      },
      window,
    );
    this.watch(() => this.#controller.abort());
    this.on(
      'online',
      () => {
        if (this.#ratingStatus === 'error') void this.#loadRatings();
      },
      window,
    );
    this.#syncInputs();
    this.#ensureRatings();
  }

  #ensureRatings() {
    if (
      (needsCatalogRatings(this.#draft) || this.props.tab === 'rating') &&
      this.#ratingStatus === 'idle'
    )
      void this.#loadRatings();
  }

  async #loadRatings() {
    if (this.#ratingStatus === 'loading') return;
    this.#ratingStatus = 'loading';
    this.#updateCount();
    try {
      this.#ratings = await loadCatalogRatings(this.props.films, {
        signal: this.#controller.signal,
      });
      this.#ratingStatus = 'ready';
    } catch {
      if (this.#controller.signal.aborted) return;
      this.#ratingStatus = 'error';
    }
    if (!this.destroyed) this.#updateCount();
  }

  #refresh() {
    const focus = (document.activeElement as HTMLElement)?.dataset.focus;
    this.refreshContent();
    this.#syncInputs();
    if (focus) this.query(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  }

  #updateCount() {
    const state = this.context();
    const from = this.find<HTMLInputElement>('[name=yearFromRange]');
    const to = this.find<HTMLInputElement>('[name=yearToRange]');
    from.value = String(state.yearLow);
    to.value = String(state.yearHigh);
    this.find('[data-year-slider]').style.setProperty(
      '--year-low',
      `${((Number(from.value) - state.yearMin) / (state.yearMax - state.yearMin)) * 100}%`,
    );
    this.find('[data-year-slider]').style.setProperty(
      '--year-high',
      `${((Number(to.value) - state.yearMin) / (state.yearMax - state.yearMin)) * 100}%`,
    );
    this.find<HTMLButtonElement>('[data-apply]').disabled = state.invalid;
    this.find('[data-count]').textContent = state.pending ? 'Показать' : `Показать ${state.count}`;
    this.find('[data-year-error]').textContent = state.error;
    this.find('[data-rating-status]').textContent = state.loadingRatings
      ? 'Загружаем рейтинги…'
      : '';
    this.find('[data-rating-error]').hidden = !state.ratingError;
    this.findAll('[data-rating]').forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(Number(button.dataset.rating) === this.#draft.ratingFrom),
      ),
    );
    this.findAll<HTMLInputElement>('[data-year]').forEach((input) =>
      input.setAttribute('aria-invalid', String(Boolean(state.error))),
    );
  }

  #syncInputs() {
    this.find<HTMLDetailsElement>('.catalog-filters__genre-details').open =
      !matchMedia('(max-width: 767px)').matches || this.#genreOptionsOpen;
    this.find<HTMLInputElement>('[name="anyGenre"]').checked = this.#draft.anyGenre;
    this.find<HTMLInputElement>('[name="artistic"]').checked = !this.#draft.allGenres;
    this.#updateCount();
  }

  #position() {
    const anchor = this.props.anchor?.getBoundingClientRect();
    if (!anchor || !this.element) return;
    const rect = this.element.getBoundingClientRect();
    this.element.style.left = `${Math.max(16, Math.min(anchor.left, window.innerWidth - rect.width - 16))}px`;
    this.element.style.top = `${Math.max(16, Math.min(anchor.bottom + 8, window.innerHeight - rect.height - 16))}px`;
  }

  close() {
    this.element?.close();
    this.destroy();
  }

  destroy() {
    if (this.#closed) return;
    this.#closed = true;
    if (this.#opened) document.body.style.overflow = this.#overflow;
    const anchor = this.props.anchor;
    super.destroy();
    if (anchor?.isConnected) anchor.focus({ preventScroll: true });
    this.props.onClose?.();
  }
}
