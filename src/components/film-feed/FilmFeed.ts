import './film-feed.css';
import templateSource from './FilmFeed.hbs';
import { Component } from '../../core/component.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { arrive } from '../../services/page-transition.js';
import { SectionHeading } from '../section-heading/SectionHeading.js';
import { StatusMessage } from '../status-message/StatusMessage.js';
import { MovieGrid } from '../movie-grid/MovieGrid.js';
import { VirtualMovieGrid } from '../movie-grid/VirtualMovieGrid.js';
import { visibleContent } from '../../services/content-preferences.js';
import { ViewToggle } from '../view-toggle/ViewToggle.js';
import { Pagination, currentPageNumber } from '../pagination/Pagination.js';
import { loadAssets } from '../../core/assets.js';
import type { Film } from '../../api/films.js';
import type { CatalogRatings } from '../../services/catalog-filters.js';
import type { CatalogPager } from '../../services/catalog-pager.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';

interface FilmFeedProps {
  films: Film[];
  title?: string;
  note?: string;
  level?: number;
  count?: number | string;
  query?: URLSearchParams;
  anchor?: string;
  heading?: boolean;
  filters?: boolean;
  empty?: string;
  initialView?: string;
  initialVisible?: number;
  infinite?: boolean;
  ratings?: CatalogRatings;
  audienceRatings?: boolean;
  endLabel?: string;
  floatingTop?: boolean;
  rememberKey?: string;
  ranked?: boolean;
  onVisibleChange?: (visible: number) => void;
  onViewChange?: (view: string) => void;
  pager?: CatalogPager;
  accept?: (film: Film) => boolean;
  onFilmsChange?: (films: Film[], complete: boolean) => void;
}

const template = await loadAssets({ template: templateSource });
const feedAssets = {
  feedSpinner: new URL('../../assets/images/feed/spinner.svg', import.meta.url).href,
  feedError: new URL('../../assets/images/feed/error.svg', import.meta.url).href,
  feedRetry: new URL('../../assets/images/feed/retry.svg', import.meta.url).href,
  feedEnd: new URL('../../assets/images/feed/end.svg', import.meta.url).href,
  feedTop: new URL('../../assets/images/feed/top.svg', import.meta.url).href,
};

const PAGE_SIZE = 40;
const snapshots = new Map<string, { visible: number; filter: string }>();

export class FilmFeed extends Component<FilmFeedProps> {
  static template = template;
  grid!: MovieGrid;
  #filter = 'all';
  #visible = PAGE_SIZE;
  #loading = false;
  #failed = false;
  #ratings: CatalogRatings = new Map();
  #ratingController = new AbortController();
  #ratingQueue = Promise.resolve();

  static snapshot(key: string) {
    return snapshots.get(key) ?? { visible: 20, filter: 'all' };
  }

  static category(film: Film, filter: string) {
    if (filter === 'movie') return !film.isSeries;
    if (filter === 'series') return film.isSeries;
    if (filter === 'new') return film.year >= new Date().getFullYear() - 1;
    return true;
  }

  constructor(props: FilmFeedProps) {
    super(props);
    const saved = props.rememberKey ? snapshots.get(props.rememberKey) : null;
    const size = props.pager ? 20 : PAGE_SIZE;
    this.#visible = Math.max(size, props.initialVisible || saved?.visible || size);
    this.#filter = saved?.filter ?? 'all';
  }

  #select = (films: Film[]) =>
    visibleContent(films).filter(
      (film) =>
        (!this.props.accept || this.props.accept(film)) && FilmFeed.category(film, this.#filter),
    );

  #films() {
    return this.#select(this.props.pager?.films ?? this.props.films);
  }

  context() {
    return {
      ...this.props,
      withHeading: this.props.heading !== false,
      empty: !this.#films().length && this.props.pager?.complete !== false,
      categories: [
        { value: 'all', label: 'Все' },
        { value: 'movie', label: 'Фильмы' },
        { value: 'series', label: 'Сериалы' },
        { value: 'new', label: 'Новинки' },
      ].map((item) => ({ ...item, active: item.value === this.#filter })),
      placeholders: Array.from({ length: 5 }),
      ...feedAssets,
    };
  }

  onRender() {
    this.#ratingController = new AbortController();
    this.#ratingQueue = Promise.resolve();
    const ratingController = this.#ratingController;
    this.watch(() => ratingController.abort());
    this.#loading = false;
    this.#failed = false;
    const { query, title, level, count, empty, anchor } = this.props;
    const films = this.#films();
    this.delegate('click', '[data-filter]', (event, button) => {
      this.#filter = button.dataset.filter || 'all';
      this.#visible = this.props.pager ? 20 : PAGE_SIZE;
      this.#remember();
      this.update();
      this.query(`[data-filter="${this.#filter}"]`)?.focus({ preventScroll: true });
    });
    const view =
      (this.props.initialView || readJson(StorageKey.CATALOG_VIEW, 'grid')) === 'list'
        ? 'list'
        : 'grid';
    this.element.dataset.view = view;
    const tools = films.length
      ? new ViewToggle({ view, onChange: (next) => this.#setView(next) })
      : null;
    if (this.props.heading !== false)
      this.insert(
        'heading',
        new SectionHeading({
          title,
          level,
          count: this.props.pager
            ? `${this.props.pager.complete ? 'Всего' : 'Загружено'}: ${films.length}`
            : count,
          tools,
        }),
      );
    if (!films.length && this.props.pager?.complete !== false) {
      this.insert(
        'empty',
        new StatusMessage({
          text: this.props.filters ? 'В этой категории пока нет фильмов.' : empty,
        }),
      );
      return;
    }
    const total = Math.ceil(films.length / PAGE_SIZE);
    const current = Math.min(currentPageNumber(query), total);
    const start = (current - 1) * PAGE_SIZE;
    this.grid = this.insert(
      'grid',
      new (this.props.infinite && (this.props.pager || films.length > 80)
        ? VirtualMovieGrid
        : MovieGrid)({
        films: this.props.infinite
          ? films.slice(0, this.#visible)
          : films.slice(start, start + PAGE_SIZE),
        view,
        ratings: this.props.ratings ?? this.#ratings,
        ranked: this.props.ranked,
        rankOffset: this.props.infinite ? 0 : start,
      }),
    );
    this.#loadRatings(films.slice(0, this.#visible));
    if (this.props.infinite) {
      this.props.onVisibleChange?.(Math.min(this.#visible, films.length));
      this.#remember();
      this.#observeMore(films);
      return;
    }
    if (total > 1)
      this.insert(
        'pagination',
        new Pagination({ current, total, anchor, label: `Страницы: ${title}` }),
      );
    else this.find('[data-slot="pagination"]').remove();

    if (anchor && location.hash === `#${anchor}`)
      requestAnimationFrame(() => this.element?.scrollIntoView({ block: 'start' }));
  }

  #setView(view: string) {
    writeJson(StorageKey.CATALOG_VIEW, view);
    this.setView(view);
    this.props.onViewChange?.(view);
    arrive(this.grid.element, { duration: 280 });
  }

  setView(view: string) {
    this.element.dataset.view = view;
    this.grid.setView(view);
  }

  #observeMore(films: Film[]) {
    const top = this.find('[data-top]');
    if (this.props.floatingTop) {
      const syncTop = () => {
        top.hidden = window.scrollY < window.innerHeight * 2;
      };
      this.on('scroll', syncTop, window, { passive: true });
      syncTop();
    }
    this.delegate('click', '[data-top]', () =>
      window.scrollTo({
        top: 0,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      }),
    );
    const more = this.find('.film-feed__more');
    const end = this.query('[data-end]');
    const hasMore = () =>
      this.#visible < this.#films().length || this.props.pager?.complete === false;
    if (!hasMore()) {
      more.remove();
      if (end) {
        end.hidden = false;
        end.textContent = `Вы досмотрели всё: ${films.length}.`;
      }
      const finish = this.query('.film-feed__finish');
      if (finish) finish.hidden = false;
      return;
    }
    const controller = new AbortController();
    this.watch(() => controller.abort());
    const button = this.find<HTMLButtonElement>('[data-more]');
    const loading = this.find('[data-loading]');
    const error = this.find('[data-more-error]');
    let rendered = Math.min(this.#visible, films.length);
    const append = async () => {
      if (controller.signal.aborted || this.#loading || !more.isConnected) return;
      this.#loading = true;
      this.#failed = false;
      error.hidden = true;
      button.hidden = true;
      loading.hidden = !this.props.pager;
      more.setAttribute('aria-busy', 'true');
      const shown = rendered;
      try {
        const target = Math.max(this.#visible, shown + (this.props.pager ? 20 : PAGE_SIZE));
        await this.props.pager?.loadTo(target, this.#select, controller.signal);
        if (controller.signal.aborted) return;
        const all = this.#films();
        if (!all.length && this.props.pager?.complete) {
          this.#remember();
          this.update();
          return;
        }
        const batch = all.slice(shown, target);
        this.grid.appendFilms(batch);
        this.#loadRatings(batch);
        this.#visible = shown + batch.length;
        rendered = this.#visible;
        this.#remember();
        this.props.onFilmsChange?.(all, this.props.pager?.complete ?? true);
        const count = this.query('.section-heading__count');
        if (this.props.pager && count)
          count.textContent = `${this.props.pager.complete ? 'Всего' : 'Загружено'}: ${all.length}`;
        this.props.onVisibleChange?.(this.#visible);
        this.find('.film-feed__announcement').textContent =
          `Загружено ещё ${batch.length} фильмов. Показано ${this.#visible}${this.props.pager?.complete === false ? '.' : ` из ${all.length}.`}`;
        if (!hasMore()) {
          observer?.disconnect();
          more.remove();
          if (end) {
            end.hidden = false;
            end.textContent = `Вы досмотрели всё: ${all.length}.`;
          }
          const finish = this.query('.film-feed__finish');
          if (finish) finish.hidden = false;
        }
      } catch {
        if (controller.signal.aborted) return;
        this.#failed = true;
        error.hidden = false;
      } finally {
        if (!controller.signal.aborted) {
          this.#loading = false;
          loading.hidden = true;
          button.hidden = this.#failed;
          more.setAttribute('aria-busy', 'false');
        }
      }
    };
    let observer: IntersectionObserver | null = null;
    this.delegate('click', '[data-more], [data-more-retry]', () => void append());
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(
      (entries) => {
        if (!this.#failed && entries.some((entry) => entry.isIntersecting)) void append();
      },
      { rootMargin: `${Math.round(window.innerHeight * 1.5)}px` },
    );
    observer.observe(more);
    this.watch(() => observer?.disconnect());
  }

  #remember() {
    const key = this.props.rememberKey;
    if (!key) return;
    snapshots.delete(key);
    snapshots.set(key, {
      visible: Math.max(this.props.pager ? 20 : PAGE_SIZE, this.#visible),
      filter: this.#filter,
    });
    if (snapshots.size > 10) snapshots.delete(snapshots.keys().next().value!);
  }

  #loadRatings(films: Film[]) {
    if ((!this.props.filters && !this.props.audienceRatings) || this.props.ratings) return;
    const controller = this.#ratingController;
    const missing = films.filter((film) => !this.#ratings.has(film.id));
    if (!missing.length) return;
    this.#ratingQueue = this.#ratingQueue.then(async () => {
      if (controller.signal.aborted) return;
      try {
        const ratings = await loadCatalogRatings(missing, { signal: controller.signal });
        if (controller.signal.aborted) return;
        ratings.forEach((rating, id) => this.#ratings.set(id, rating));
        this.grid.setRatings(this.#ratings);
      } catch {
        // Лента остаётся доступной, если сервис оценок не ответил.
      }
    });
  }
}
