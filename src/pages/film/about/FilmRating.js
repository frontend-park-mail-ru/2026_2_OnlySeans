import './film-rating.css';
import templateSource from './FilmRating.hbs';
import { Component } from '../../../core/component.js';
import { store } from '../../../core/store.js';
import { countLabel } from '../../../core/format.js';
import { getAudienceRating } from '../../../api/reviews.js';
import { clearScore, myScore, setScore } from '../../../services/my-review.js';
import { errorMessage } from '../../../api/errors.js';
import { formatScore, scoreWord } from '../../../services/ratings.js';
import { ScoreScale } from '../../../components/score-scale/ScoreScale.js';
import { loginPathHere } from '../../../services/auth-return.js';
import { notify } from '../../../services/notice.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class FilmRating extends Component {
  static template = template;

  #audience = { average: 0, count: 0 };
  #busy = false;
  #loaded = false;
  #pending = null;
  #refs = {};
  #scale = null;

  get #score() {
    return myScore(this.props.film.id);
  }

  get #shown() {
    return this.#pending ?? this.#score;
  }

  #texts() {
    const { average, count } = this.#audience;
    const value = this.#shown;
    const what = this.props.film.isSeries ? 'сериал' : 'фильм';
    return {
      average: average ? formatScore(average) : '',
      audience: average
        ? `средняя оценка зрителей\n${countLabel(count, ['оценка', 'оценки', 'оценок'])}`
        : `Зрители ещё не оценили ${what}.`,
      mine: value ? `${value}, ${scoreWord(value)}` : '',
    };
  }

  context() {
    return {
      ...this.#texts(),
      user: store.get('user'),
      loginHref: loginPathHere(),
    };
  }

  onRender() {
    this.#refs = this.refs();
    this.#scale = store.get('user')
      ? this.insert(
          'scale',
          new ScoreScale({
            labelledBy: 'film-rating-mine',
            onSelect: (value) => this.#rate(value),
          }),
        )
      : null;
    this.delegate('click', '.film-rating__reset', () => this.#reset());

    this.watch(store.watch('myReview', () => !this.#busy && this.#paint()));
    this.#paint();
    if (!this.#loaded) {
      this.#loaded = true;
      this.#loadAudience();
    }
  }

  #paint() {
    if (!this.element) return;
    const value = this.#shown;
    const texts = this.#texts();
    const { average, count, mine, mineBox, reset } = this.#refs;

    this.#setText(average, texts.average);
    average.hidden = !texts.average;
    count.textContent = texts.audience;
    if (!mine) return;

    this.#setText(mine, texts.mine);
    mineBox.hidden = !value;
    reset.hidden = !value;
    reset.disabled = this.#busy;
    this.#scale.paint(value, this.#busy);
  }

  #setText(element, text) {
    if (element.textContent === text) return;
    element.textContent = text;
    element.classList.remove('film-rating__changed');
    element.getBoundingClientRect();
    element.classList.add('film-rating__changed');
  }

  async #loadAudience() {
    try {
      this.#audience = await getAudienceRating(this.props.film.id);
    } catch {
      this.#audience = { average: 0, count: 0 };
    }
    this.#paint();
  }

  async #rate(value) {
    if (this.#busy || value === this.#score) return;
    await this.#save(value, () => setScore(this.props.film.id, value));
    this.#scale?.focus();
  }

  async #reset() {
    if (this.#busy || !this.#score) return;
    await this.#save(0, () => clearScore(this.props.film.id));
    this.#scale?.focus();
  }

  async #save(value, action) {
    this.#busy = true;
    this.#pending = value;
    this.#paint();
    try {
      await action();
      this.#audience = await getAudienceRating(this.props.film.id);
    } catch (error) {
      notify(errorMessage(error), { type: 'error' });
    } finally {
      this.#busy = false;
      this.#pending = null;
      this.#paint();
    }
  }
}
