import { Component } from '../../../core/component.js';
import { store } from '../../../core/store.js';
import { countLabel } from '../../../core/format.js';
import { deleteRating, getAudienceRating, getMyRating, saveRating } from '../../../api/ratings.js';
import { errorMessage } from '../../../api/errors.js';
import { SCORES, formatScore, scoreWord } from '../../../services/ratings.js';
import { loginPathHere } from '../../../services/auth-return.js';
import { notify } from '../../../services/notice.js';
import { loadStyles, loadTemplate } from '../../../core/assets.js';

loadStyles(new URL('./film-rating.css', import.meta.url));
const template = await loadTemplate(new URL('./FilmRating.hbs', import.meta.url));

const ARROW_STEPS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

export class FilmRating extends Component {
  static template = template;

  #audience = { average: 0, count: 0 };
  #mine = null;
  #busy = false;
  #loaded = false;

  context() {
    const value = this.#mine?.value || 0;
    return {
      user: store.get('user'),
      loginHref: loginPathHere(),
      what: this.props.film.isSeries ? 'сериал' : 'фильм',
      average: this.#audience.average ? formatScore(this.#audience.average) : '',
      count: countLabel(this.#audience.count, ['оценка', 'оценки', 'оценок']),
      mine: value,
      mineWord: value ? scoreWord(value) : '',
      busy: this.#busy,
      scores: SCORES.map((score) => ({
        score,
        word: scoreWord(score),
        filled: value >= score,
        checked: value === score,
        tabindex: value === score || (!value && score === 1) ? 0 : -1,
      })),
    };
  }

  onRender() {
    this.delegate('click', '.film-rating__score', (event, button) =>
      this.#rate(Number(button.dataset.score)),
    );
    this.delegate('click', '.film-rating__reset', () => this.#reset());
    this.delegate('keydown', '.film-rating__scale', (event) => this.#onArrows(event));

    this.watch(store.watch('user', () => this.#load()));
    if (!this.#loaded) {
      this.#loaded = true;
      this.#load();
    }
  }

  async #load() {
    const user = store.get('user');
    const filmId = this.props.film.id;
    try {
      [this.#audience, this.#mine] = await Promise.all([
        getAudienceRating(filmId),
        user ? getMyRating(filmId) : null,
      ]);
    } catch {
      this.#audience = { average: 0, count: 0 };
      this.#mine = null;
    }
    if (this.element) this.update();
  }

  async #rate(value) {
    if (this.#busy || value === this.#mine?.value) return;
    await this.#save(() => saveRating(this.props.film.id, value));
    this.element?.querySelector(`[data-score="${this.#mine?.value}"]`)?.focus();
  }

  async #reset() {
    if (this.#busy || !this.#mine) return;
    await this.#save(async () => {
      await deleteRating(this.props.film.id);
      return null;
    });
    this.element?.querySelector('.film-rating__score')?.focus();
  }

  async #save(action) {
    this.#busy = true;
    this.update();
    try {
      this.#mine = await action();
      this.#audience = await getAudienceRating(this.props.film.id);
    } catch (error) {
      notify(errorMessage(error), { type: 'error' });
    } finally {
      this.#busy = false;
      if (this.element) this.update();
    }
  }

  #onArrows(event) {
    const current = this.#mine?.value || 0;
    let next = null;
    if (ARROW_STEPS[event.key]) next = Math.min(10, Math.max(1, current + ARROW_STEPS[event.key]));
    if (event.key === 'Home') next = 1;
    if (event.key === 'End') next = 10;
    if (next === null) return;
    event.preventDefault();
    this.#rate(next);
  }
}
