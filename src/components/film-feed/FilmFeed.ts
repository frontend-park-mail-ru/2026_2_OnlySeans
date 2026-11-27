import './film-feed.css';
import templateSource from './FilmFeed.hbs';
import { Component } from '../../core/component.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { arrive } from '../../services/page-transition.js';
import { SectionHeading } from '../section-heading/SectionHeading.js';
import { StatusMessage } from '../status-message/StatusMessage.js';
import { MovieGrid } from '../movie-grid/MovieGrid.js';
import { ViewToggle } from '../view-toggle/ViewToggle.js';
import { Pagination, currentPageNumber } from '../pagination/Pagination.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const PAGE_SIZE = 40;

export class FilmFeed extends Component {
  static template = template;
  grid: MovieGrid;
  #filter = 'all';
  #visible = PAGE_SIZE;

  constructor(props) {
    super(props);
    this.#visible = Math.max(PAGE_SIZE, props.initialVisible || PAGE_SIZE);
  }

  #films() {
    return this.props.films.filter((film) => {
      if (this.#filter === 'movie') return !film.isSeries;
      if (this.#filter === 'series') return film.isSeries;
      if (this.#filter === 'new') return film.year >= new Date().getFullYear() - 1;
      return true;
    });
  }

  context() {
    return {
      ...this.props,
      withHeading: this.props.heading !== false,
      empty: !this.#films().length,
      categories: [
        { value: 'all', label: 'Все' },
        { value: 'movie', label: 'Фильмы' },
        { value: 'series', label: 'Сериалы' },
        { value: 'new', label: 'Новинки' },
      ].map((item) => ({ ...item, active: item.value === this.#filter })),
    };
  }

  onRender() {
    const { query, title, level, count, empty, anchor } = this.props;
    const films = this.#films();
    this.delegate('click', '[data-filter]', (event, button) => {
      this.#filter = button.dataset.filter;
      this.#visible = PAGE_SIZE;
      this.update();
      this.find(`[data-filter="${this.#filter}"]`)?.focus({ preventScroll: true });
    });
    const view =
      (this.props.initialView || readJson(StorageKey.CATALOG_VIEW, 'grid')) === 'list'
        ? 'list'
        : 'grid';
    const tools = films.length
      ? new ViewToggle({ view, onChange: (next) => this.#setView(next) })
      : null;
    if (this.props.heading !== false)
      this.insert('heading', new SectionHeading({ title, level, count, tools }));
    if (!films.length) {
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
      new MovieGrid({
        films: this.props.infinite
          ? films.slice(0, this.#visible)
          : films.slice(start, start + PAGE_SIZE),
        view,
        ratings: this.props.ratings,
      }),
    );
    if (this.props.infinite) {
      this.props.onVisibleChange?.(Math.min(this.#visible, films.length));
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

  #setView(view) {
    writeJson(StorageKey.CATALOG_VIEW, view);
    this.grid.setView(view);
    arrive(this.grid.element, { duration: 280 });
  }

  #observeMore(films) {
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
    const end = this.find('[data-end]');
    if (this.#visible >= films.length) {
      more.remove();
      if (end) end.hidden = false;
      return;
    }
    const append = () => {
      if (!this.element || !more.isConnected) return;
      const batch = films.slice(this.#visible, this.#visible + PAGE_SIZE);
      if (!batch.length) return;
      this.grid.appendFilms(batch);
      this.#visible += batch.length;
      this.props.onVisibleChange?.(this.#visible);
      this.find('.film-feed__announcement').textContent =
        `Загружено ещё ${batch.length} фильмов. Показано ${this.#visible} из ${films.length}.`;
      if (this.#visible >= films.length) {
        more.remove();
        if (end) end.hidden = false;
      }
    };
    this.delegate('click', '[data-more]', append);
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) append();
      },
      { rootMargin: '600px' },
    );
    observer.observe(more);
    this.watch(() => observer.disconnect());
  }
}
