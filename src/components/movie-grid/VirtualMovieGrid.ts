import { MovieGrid } from './MovieGrid.js';
import { MovieCard } from '../movie-card/MovieCard.js';
import type { Film } from '../../api/films.js';
import type { CatalogRatings } from '../../services/catalog-filters.js';
import { rowAt, visibleRows } from '../../services/virtual-feed.js';

interface Row {
  element: HTMLDivElement;
  cards: MovieCard[];
}
const measurements = new Map<string, number>();

/** Отрисовывает видимые строки и запас вокруг экрана, измеряя настоящую высоту карточек. */
export class VirtualMovieGrid extends MovieGrid {
  #films: Film[] = [];
  #ratings: CatalogRatings = new Map();
  #rows = new Map<number, Row>();
  #offsets: number[] = [0];
  #columns = 1;
  #width = 0;
  #gap = 0;
  #estimate = 400;
  #frame = 0;
  #observer: ResizeObserver | null = null;
  #anchor: { film: number; offset: number } | null = null;
  #dirty = true;

  onRender() {
    this.#films = [...this.props.films];
    this.#ratings = this.props.ratings || new Map();
    this.#rows.clear();
    this.#width = 0;
    this.#dirty = true;
    this.element.classList.add('movie-grid--virtual');
    this.element.style.setProperty('overflow-anchor', 'none');
    this.element.setAttribute('role', 'list');
    this.element.setAttribute('aria-label', 'Фильмы');
    this.on('scroll', this.#schedule, window, { passive: true });
    this.on('resize', this.#schedule, window, { passive: true });
    this.on('focusout', this.#schedule);
    if (typeof ResizeObserver !== 'undefined') {
      this.#observer = new ResizeObserver(this.#schedule);
      this.#observer.observe(this.element);
    }
    this.watch(() => {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
      this.#observer?.disconnect();
    });
    this.#schedule();
  }

  #schedule = () => {
    if (this.#frame || this.destroyed) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      if (this.element.isConnected) this.#draw();
    });
  };

  #key(index: number) {
    const ids = this.#films
      .slice(index * this.#columns, (index + 1) * this.#columns)
      .map((film) => film.id);
    return `${this.props.view}:${this.#width}:${this.#columns}:${ids.join(',')}`;
  }

  #geometry() {
    if (!this.#dirty) return;
    this.#dirty = false;
    const count = Math.ceil(this.#films.length / this.#columns);
    this.#offsets = [0];
    for (let index = 0; index < count; index++) {
      const height = measurements.get(this.#key(index)) ?? this.#estimate;
      this.#offsets.push(this.#offsets[index] + height + (index < count - 1 ? this.#gap : 0));
    }
    this.element.style.height = `${this.#offsets[count]}px`;
  }

  #removeRow(index: number, row: Row) {
    this.#observer?.unobserve(row.element);
    row.cards.forEach((card) => this.remove(card));
    row.element.remove();
    this.#rows.delete(index);
  }

  #draw() {
    const style = getComputedStyle(this.element);
    const width = Math.round(this.element.getBoundingClientRect().width);
    if (!width) return;
    const columns = Number(style.getPropertyValue('--movie-columns')) || 1;
    const resized = width !== this.#width || columns !== this.#columns;
    if (resized) {
      this.#dirty = true;
      if (this.#width && !this.#anchor) this.#rememberAnchor();
      this.#rows.forEach((row, index) => this.#removeRow(index, row));
      this.#width = width;
      this.#columns = columns;
      this.#gap = parseFloat(style.rowGap) || 0;
      const cardWidth = (width - (parseFloat(style.columnGap) || 0) * (columns - 1)) / columns;
      this.#estimate =
        this.props.view === 'list' ? (innerWidth < 768 ? 158 : 146) : cardWidth * 1.5 + 132;
    }
    this.#geometry();
    if (this.#anchor) {
      const index = Math.floor(this.#anchor.film / columns);
      window.scrollBy({
        top: this.element.getBoundingClientRect().top + this.#offsets[index] + this.#anchor.offset,
        behavior: 'instant',
      });
      this.#anchor = null;
    }
    const top = -this.element.getBoundingClientRect().top;
    const anchor = rowAt(this.#offsets, Math.max(0, top));
    const before = this.#offsets[anchor];
    const range = visibleRows(this.#offsets, top, innerHeight, innerHeight);
    const wanted = new Set<number>();
    for (let index = range.start; index < range.end; index++) wanted.add(index);
    this.#rows.forEach((row, index) => {
      if (row.element.contains(document.activeElement)) wanted.add(index);
    });
    this.#rows.forEach((row, index) => {
      if (!wanted.has(index)) this.#removeRow(index, row);
    });
    let changed = false;
    [...wanted]
      .sort((a, b) => a - b)
      .forEach((index) => {
        let row = this.#rows.get(index);
        if (!row) {
          const element = document.createElement('div');
          element.className = 'movie-grid__virtual-row';
          element.setAttribute('role', 'presentation');
          const next = [...this.#rows]
            .sort(([a], [b]) => a - b)
            .find(([existing]) => existing > index)?.[1].element;
          this.element.insertBefore(element, next ?? null);
          const cards = this.#films
            .slice(index * columns, (index + 1) * columns)
            .map((film, column) => {
              const card = this.insert(
                element,
                new MovieCard({ film, rating: this.#ratings.get(film.id) }),
              );
              card.element.setAttribute('role', 'listitem');
              card.element.setAttribute('aria-posinset', String(index * columns + column + 1));
              card.element.setAttribute('aria-setsize', String(this.#films.length));
              return card;
            });
          row = { element, cards };
          this.#rows.set(index, row);
          this.#observer?.observe(element);
        }
        const height = row.element.getBoundingClientRect().height;
        if (
          height > 0 &&
          Math.abs((measurements.get(this.#key(index)) ?? this.#estimate) - height) > 0.5
        ) {
          measurements.set(this.#key(index), height);
          changed = true;
        }
      });
    while (measurements.size > 5000) measurements.delete(measurements.keys().next().value!);
    if (changed) {
      this.#dirty = true;
      this.#geometry();
      const shift = this.#offsets[anchor] - before;
      if (!resized && top > 0 && shift) window.scrollBy({ top: shift, behavior: 'instant' });
      this.#schedule();
    }
    this.#rows.forEach((row, index) => {
      row.element.style.transform = `translateY(${this.#offsets[index]}px)`;
      row.cards.forEach((card) =>
        card.element.setAttribute('aria-setsize', String(this.#films.length)),
      );
    });
  }

  appendFilms(films: Film[]) {
    this.#films.push(...films);
    this.#dirty = true;
    // Неполная последняя строка должна получить добавленные карточки.
    const last = Math.floor((this.#films.length - films.length) / this.#columns);
    const row = this.#rows.get(last);
    if (row) this.#removeRow(last, row);
    this.#schedule();
  }

  setRatings(ratings: CatalogRatings) {
    this.#ratings = ratings;
    this.#rows.forEach((row) =>
      row.cards.forEach((card) => card.setRating(ratings.get(card.props.film.id))),
    );
  }

  setView(view: string) {
    if (view === this.props.view) return;
    this.#rememberAnchor();
    this.props.films = this.#films;
    this.props.ratings = this.#ratings;
    this.update({ view });
  }

  #rememberAnchor() {
    const top = -this.element.getBoundingClientRect().top;
    if (top <= 0 || top >= this.#offsets[this.#offsets.length - 1]) return;
    const row = rowAt(this.#offsets, top);
    this.#anchor = { film: row * this.#columns, offset: top - this.#offsets[row] };
  }
}
