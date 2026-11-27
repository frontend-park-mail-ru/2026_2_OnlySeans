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
import { MyReview } from '../reviews/mine/MyReview.js';

const template = await loadAssets({ template: templateSource });
const star = new URL('../../../assets/icons/film-star.svg', import.meta.url).href;
const rateIcon = new URL('../../../assets/icons/film-rate.svg', import.meta.url).href;
const closeIcon = new URL('../../../assets/icons/film-close.svg', import.meta.url).href;

export class FilmRating extends Component {
  static template = template;

  #audience: { average: number; count: number } | null = null;
  #busy = false;
  #loaded = false;
  #pending = null;
  #refs: ReturnType<Component['refs']> = {};
  #scale = null;
  #error = '';

  get #score() {
    return myScore(this.props.film.id);
  }

  get #shown() {
    return this.#pending ?? this.#score;
  }

  #texts() {
    const { average, count } = this.#audience ?? { average: 0, count: 0 };
    const value = this.#shown;
    const what = this.props.film.isSeries ? 'сериал' : 'фильм';
    return {
      average: average ? formatScore(average) : '',
      audience: average
        ? `средняя оценка зрителей\n${countLabel(count, ['оценка', 'оценки', 'оценок'])}`
        : this.#audience
          ? `Зрители ещё не оценили ${what}.`
          : 'Средняя оценка недоступна.',
      mine: value ? `${value}, ${scoreWord(value)}` : '',
    };
  }

  context() {
    return {
      ...this.#texts(),
      star,
      rateIcon,
      closeIcon,
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
    const dialog = this.find<HTMLDialogElement>('.film-rating__dialog');
    let previousOverflow: string | null = null;
    const release = () => {
      if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
      previousOverflow = null;
    };
    this.delegate('click', '[data-rate-open]', () => {
      if (!store.get('user')) {
        notify('Войдите, чтобы оценить фильм.', {
          action: { label: 'Войти', href: loginPathHere() },
        });
        return;
      }
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
    this.delegate('click', '[data-rate-close]', () => dialog.close());
    this.on(
      'click',
      (event) => {
        if (event.target === dialog) dialog.close();
      },
      dialog,
    );
    this.on(
      'close',
      () => {
        release();
        if (this.element?.isConnected)
          this.find('[data-rate-open]')?.focus({ preventScroll: true });
      },
      dialog,
    );
    this.watch(() => {
      if (dialog.open) dialog.close();
      release();
    });
    if (store.get('user'))
      this.insert('review', new MyReview({ film: this.props.film, onDone: () => dialog.close() }));
    this.watch(store.watch('user', () => this.update()));

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
    this.#refs.error.textContent = this.#error;

    this.#setText(average, texts.average);
    average.hidden = !texts.average;
    count.textContent = texts.audience;
    if (!mine) return;

    this.#setText(mine, texts.mine);
    mineBox.hidden = !value;
    reset.hidden = !value;
    (reset as HTMLButtonElement).disabled = this.#busy;
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
      this.#audience = null;
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
    this.#error = '';
    this.#busy = true;
    this.#pending = value;
    this.#paint();
    try {
      if (await action()) {
        notify('Отправим оценку после подключения к сети.', { type: 'info' });
        return;
      }
      this.#audience = await getAudienceRating(this.props.film.id);
    } catch (error) {
      this.#error = errorMessage(error);
      notify(errorMessage(error), { type: 'error' });
    } finally {
      this.#busy = false;
      this.#pending = null;
      this.#paint();
    }
  }
}
