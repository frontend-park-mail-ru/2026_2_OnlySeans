import './review-form.css';
import templateSource from './ReviewForm.hbs';
import { Component } from '../../../../core/component.js';
import { store } from '../../../../core/store.js';
import { errorMessage } from '../../../../api/errors.js';
import { myReview, removeReview, saveReview } from '../../../../services/my-review.js';
import { limitTextInput } from '../../../../services/text-limit.js';
import { countLabel } from '../../../../core/format.js';
import { notify } from '../../../../services/notice.js';
import { loadAssets } from '../../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const Limit = Object.freeze({
  TITLE_MIN: 1,
  TITLE_MAX: 32,
  TEXT_MIN: 50,
  TEXT_MAX: 20000,
});

const length = (value) => Array.from(value).length;

const EMPTY = Object.freeze({ title: '', text: '', spoiler: false });

export class ReviewForm extends Component {
  static template = template;

  #busy = false;
  #draft = null;
  #shown = null;

  get #saved() {
    return myReview(this.props.film.id);
  }

  #savedValues() {
    const saved = this.#saved;
    return saved ? { title: saved.title, text: saved.text, spoiler: saved.spoiler } : EMPTY;
  }

  context() {
    const values = this.#draft ?? this.#savedValues();
    return {
      ...values,
      editing: Boolean(this.#saved),
      busy: this.#busy,
      canCancel: Boolean(this.props.onCancel),
      what: this.props.film.isSeries ? 'сериал' : 'фильм',
    };
  }

  onRender() {
    const { title, text, spoiler } = this.element.elements;
    limitTextInput(title, Limit.TITLE_MAX, {
      onLimit: () => notify(`Заголовок не длиннее ${Limit.TITLE_MAX} символов.`),
    });
    limitTextInput(text, Limit.TEXT_MAX, {
      onLimit: () => notify(`Отзыв не длиннее ${Limit.TEXT_MAX} символов.`),
    });
    this.on('input', () => this.#refresh(), title);
    this.on('input', () => this.#refresh(), text);
    this.on('change', () => this.#refresh(), spoiler);
    this.on('submit', (event) => this.#save(event));
    this.delegate('click', '[name="delete"]', () => this.#remove());
    this.delegate('click', '[name="cancel"]', () => this.props.onCancel());
    this.watch(store.watch('myReview', () => !this.#busy && !this.#edited() && this.update()));
    this.#shown = this.#values();
    this.#refresh();
  }

  focus() {
    const { text } = this.element.elements;
    text.focus();
    text.setSelectionRange(text.value.length, text.value.length);
  }

  #values() {
    const { title, text, spoiler } = this.element.elements;
    return { title: title.value.trim(), text: text.value.trim(), spoiler: spoiler.checked };
  }

  #differs(a, b) {
    return a.title !== b.title || a.text !== b.text || a.spoiler !== b.spoiler;
  }

  #edited() {
    return this.#differs(this.#values(), this.#shown);
  }

  #valid({ title, text }) {
    return length(title) >= Limit.TITLE_MIN && length(text) >= Limit.TEXT_MIN;
  }

  #hint(text) {
    const missing = Limit.TEXT_MIN - length(text);
    if (missing > 0) return `Ещё ${countLabel(missing, ['символ', 'символа', 'символов'])}`;
    return `${length(text)} / ${Limit.TEXT_MAX}`;
  }

  #refresh() {
    const { counter, save } = this.element.elements;
    const values = this.#values();
    counter.value = this.#hint(values.text);
    save.disabled =
      this.#busy || !this.#valid(values) || !this.#differs(values, this.#savedValues());
  }

  async #run(action, done) {
    this.#busy = true;
    this.update();
    try {
      await action();
      this.#draft = null;
      notify(done, { type: 'success' });
      this.props.onDone?.();
    } catch (error) {
      notify(errorMessage(error), { type: 'error' });
    } finally {
      this.#busy = false;
      if (this.element) this.update();
    }
  }

  #save(event) {
    event.preventDefault();
    const values = this.#values();
    if (this.#busy || !this.#valid(values) || !this.#differs(values, this.#savedValues())) return;
    const editing = Boolean(this.#saved);
    this.#draft = values;
    this.#run(
      () => saveReview(this.props.film.id, values),
      editing ? 'Отзыв сохранён.' : 'Отзыв опубликован.',
    );
  }

  #remove() {
    if (this.#busy) return;
    this.#draft = EMPTY;
    this.#run(() => removeReview(this.props.film.id), 'Отзыв удалён.');
  }
}
