import './watch-later.css';
import templateSource from './WatchLater.hbs';
import { getFilm, type Film } from '../../../api/films.js';
import { visibleContent } from '../../../services/content-preferences.js';
import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { readLibrary, watchLibrary } from '../../../services/library.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';
import { MovieCard } from '../../../components/movie-card/MovieCard.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class WatchLater extends Component<{ films: Film[] }> {
  static template = template;
  saved: Film[] = [];
  #extra = new Map<number, Film>();
  #failed = false;

  context() {
    const byId = new Map<number, Film>([
      ...this.#extra,
      ...this.props.films.map((film) => [film.id, film] as const),
    ]);
    this.saved = readLibrary()
      .watchlater.slice(0, 5)
      .map((id) => byId.get(id))
      .filter((film): film is Film => film !== undefined);
    this.saved = visibleContent(this.saved);
    return {
      films: this.saved,
      loading: !this.#failed && this.#missing().length > 0,
      failed: this.#failed,
    };
  }

  onRender() {
    const count = readLibrary().watchlater.length
      ? countLabel(readLibrary().watchlater.length, ['фильм', 'фильма', 'фильмов'])
      : '';
    this.insert('heading', new SectionHeading({ title: 'Смотреть позже', count }));
    const row = this.query('.watch-later__row');
    if (row) this.saved.forEach((film) => this.insert(row, new MovieCard({ film })));
    this.watch(watchLibrary(() => this.update()));
    this.delegate('click', '[data-watchlater-retry]', () => {
      this.#failed = false;
      this.update();
    });
    const missing = this.#missing();
    if (!missing.length || this.#failed) return;
    const controller = new AbortController();
    this.watch(() => controller.abort());
    void Promise.allSettled(missing.map((id) => getFilm(id, { signal: controller.signal }))).then(
      (results) => {
        if (controller.signal.aborted) return;
        this.#failed = results.some((result) => result.status === 'rejected');
        results.forEach((result) => {
          if (result.status === 'fulfilled') this.#extra.set(result.value.id, result.value);
        });
        this.update();
      },
    );
  }

  #missing() {
    const known = new Set([...this.#extra.keys(), ...this.props.films.map((film) => film.id)]);
    return readLibrary()
      .watchlater.slice(0, 5)
      .filter((id) => !known.has(id));
  }
}
