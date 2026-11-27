import { getFilmsPage, type Film } from '../api/films.js';

interface Snapshot {
  films: Film[];
  offset: number;
  total: number;
  complete: boolean;
  at: number;
}
let cached: Snapshot | null = null;
let revision = 0;
const FRESH_MS = 60_000;

export function invalidateCatalogPager() {
  cached = null;
  revision++;
}

/** Независимый курсор ленты. Успешные порции переживают SPA-переход, ошибка не сдвигает offset. */
export class CatalogPager {
  #state: Snapshot;
  #revision: number;
  constructor({ fresh = false } = {}) {
    if (fresh || (cached && Date.now() - cached.at >= FRESH_MS)) {
      cached = null;
      revision++;
    }
    this.#revision = revision;
    this.#state =
      cached && Date.now() - cached.at < FRESH_MS
        ? { ...cached, films: [...cached.films] }
        : { films: [], offset: 0, total: 0, complete: false, at: Date.now() };
  }
  get films() {
    return this.#state.films;
  }
  get complete() {
    return this.#state.complete;
  }

  /** Читает страницы, пока не собрана порция выбранного типа или не исчерпан исходный каталог. */
  async loadTo(minimum: number, select: (films: Film[]) => Film[], signal: AbortSignal) {
    while (!this.complete && select(this.films).length < minimum) {
      signal.throwIfAborted();
      const page = await getFilmsPage(this.#state.offset, { signal });
      signal.throwIfAborted();
      const known = new Set(this.films.map((film) => film.id));
      const added = page.films.filter((film) => !known.has(film.id) && Boolean(known.add(film.id)));
      if (page.films.length && !added.length)
        throw new Error('Сервер повторил уже загруженную порцию каталога');
      this.#state = {
        films: [...this.films, ...added],
        offset: this.#state.offset + page.films.length,
        total: page.total,
        complete: page.films.length === 0 || this.#state.offset + page.films.length >= page.total,
        at: Date.now(),
      };
      if (this.#revision === revision && (!cached || this.#state.offset >= cached.offset))
        cached = this.#state;
    }
  }
}
