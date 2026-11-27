import './my-review.css';
import templateSource from './MyReview.hbs';
import { Component } from '../../../../core/component.js';
import { store } from '../../../../core/store.js';
import { myReview, reviewDraft } from '../../../../services/my-review.js';
import { ReviewCard } from '../card/ReviewCard.js';
import { ReviewForm } from '../form/ReviewForm.js';
import { loadAssets } from '../../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const Mode = Object.freeze({ CARD: 'card', FORM: 'form' });

export class MyReview extends Component {
  static template = template;

  #editing = Boolean(reviewDraft(this.props.film.id));
  #mode: 'form' | 'card' | null = null;
  #form: ReviewForm | null = null;

  get #review() {
    return myReview(this.props.film.id);
  }

  #currentMode() {
    return this.#review && !this.#editing ? Mode.CARD : Mode.FORM;
  }

  context() {
    return { showCard: this.#currentMode() === Mode.CARD };
  }

  onRender() {
    this.#mode = this.#currentMode();
    if (this.#mode === Mode.CARD) {
      this.insert('card', new ReviewCard({ review: this.#review, own: true }));
      this.delegate('click', '[data-edit]', () => this.#edit());
    } else {
      this.#form = this.insert(
        'form',
        new ReviewForm({
          film: this.props.film,
          onDone: () => this.#close(),
          onCancel: this.#editing ? () => this.#close() : undefined,
        }),
      );
    }
    this.watch(store.watch('myReview', () => this.#sync()));
  }

  #sync() {
    if (this.#currentMode() !== this.#mode || this.#mode === Mode.CARD) this.update();
  }

  #edit() {
    this.#editing = true;
    this.update();
    this.#form?.focus();
  }

  #close() {
    this.#editing = false;
    if (!this.destroyed) this.update();
    this.props.onDone?.();
  }
}
