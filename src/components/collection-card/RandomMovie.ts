import './random-movie.css';
import templateSource from './RandomMovie.hbs';
import { Modal } from '../modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import { wheelRandom } from '../../services/wheel.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import type { Film } from '../../api/films.js';
const template = await loadAssets({ template: templateSource });
export class RandomMovie extends Modal {
  static template = template;
  #film: Film | undefined;
  #excluded = new Set<number>();
  #controller: AbortController | null = null;
  constructor(props: { films: Film[]; title: string }) {
    super(props);
    this.#choose();
  }
  context() {
    return {
      film: this.#film,
      title: this.props.title,
      count: this.props.films.length,
      position: this.#film
        ? (this.props.films as Film[]).findIndex((film) => film.id === this.#film!.id) + 1
        : 0,
    };
  }
  onRender() {
    this.watch(() => this.#controller?.abort());
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-link]', () => this.close());
    this.delegate('click', '[data-next]', () => this.#next(false));
    this.delegate('click', '[data-exclude]', () => this.#next(true));
    this.delegate('click', '[data-reset]', () => {
      this.#excluded.clear();
      this.#next(false);
    });
    void this.#rating();
  }
  #choose() {
    const films = this.props.films as Film[];
    let candidates = films.filter(
      (film) => !this.#excluded.has(film.id) && film.id !== this.#film?.id,
    );
    if (!candidates.length) candidates = films.filter((film) => !this.#excluded.has(film.id));
    this.#film = candidates[Math.floor(wheelRandom() * candidates.length)];
  }
  #next(exclude: boolean) {
    this.#controller?.abort();
    if (exclude && this.#film) this.#excluded.add(this.#film.id);
    this.#choose();
    this.refreshContent();
    void this.#rating();
  }
  async #rating() {
    if (!this.#film) return;
    const controller = new AbortController();
    this.#controller = controller;
    const film = this.#film;
    try {
      const ratings = await loadCatalogRatings([film], { signal: controller.signal });
      if (this.destroyed || controller.signal.aborted || this.#film?.id !== film.id) return;
      const rating = ratings.get(film.id);
      this.find('[data-rating]').textContent = rating?.votes
        ? '★ ' + rating.average.toLocaleString('ru', { maximumFractionDigits: 1 })
        : 'Оценок пока нет';
    } catch {
      if (!this.destroyed && !controller.signal.aborted)
        this.find('[data-rating]').textContent = 'Рейтинг недоступен';
    }
  }
}
