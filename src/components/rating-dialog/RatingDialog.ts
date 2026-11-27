import templateSource from './RatingDialog.hbs';
import { Modal } from '../modal/Modal.js';
import { ScoreScale } from '../score-scale/ScoreScale.js';
import { loadAssets } from '../../core/assets.js';
import { setScore } from '../../services/my-review.js';
import { notify } from '../../services/notice.js';
import { errorMessage } from '../../api/errors.js';
const template = await loadAssets({ template: templateSource });
export class RatingDialog extends Modal {
  static template = template;
  #score = 0;
  #busy = false;
  #scale: ScoreScale | null = null;
  constructor(props: {
    filmId: number;
    title: string;
    score: number;
    onSaved(score: number): void;
  }) {
    super(props);
    this.#score = props.score;
  }
  onRender() {
    this.#scale = this.insert(
      'scale',
      new ScoreScale({
        value: this.#score,
        labelledBy: 'rating-dialog-title',
        onSelect: (value) => {
          this.#score = value;
          this.#scale?.paint(value);
        },
      }),
    );
    this.delegate('click', '[data-close]', () => {
      if (!this.#busy) this.close();
    });
    this.delegate('click', '[data-reset]', () => {
      this.#score = 0;
      this.#scale?.paint(0);
    });
    this.on('submit', async (event) => {
      event.preventDefault();
      if (this.#busy) return;
      this.#busy = true;
      this.#scale?.paint(this.#score, true);
      this.findAll<HTMLButtonElement>('button').forEach((button) => {
        button.disabled = true;
      });
      try {
        const queued = await setScore(this.props.filmId, this.#score);
        if (this.destroyed) return;
        this.props.onSaved(this.#score);
        if (queued) notify('Оценка сохранена на устройстве и отправится при подключении к сети.');
        this.close();
      } catch (error) {
        if (!this.destroyed)
          this.find('[data-error]').textContent =
            errorMessage(error) || 'Не удалось сохранить оценку. Попробуйте ещё раз.';
      } finally {
        this.#busy = false;
        if (!this.destroyed) {
          this.#scale?.paint(this.#score);
          this.findAll<HTMLButtonElement>('button').forEach((button) => {
            button.disabled = false;
          });
        }
      }
    });
  }
}
