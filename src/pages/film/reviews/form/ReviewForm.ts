import './review-form.css';
import templateSource from './ReviewForm.hbs';
import { Component } from '../../../../core/component.js';
import { eventBus } from '../../../../core/event-bus.js';
import { store } from '../../../../core/store.js';
import { errorMessage } from '../../../../api/errors.js';
import { isValidReviewTitle, MAX_REVIEW_TITLE_LENGTH, reviewPolicyErrorMessage } from '../../../../api/reviews.js';
import { myReview, removeReview, reviewDraft, saveReview } from '../../../../services/my-review.js';
import { pendingFilmEdit } from '../../../../services/offline-film-edits.js';
import { limitTextInput } from '../../../../services/text-limit.js';
import { countLabel } from '../../../../core/format.js';
import { notify } from '../../../../services/notice.js';
import { loadAssets } from '../../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const Limit = Object.freeze({
  TEXT_MIN: 50,
  TEXT_HARD_MAX: 20000,
});

const length = (value) => Array.from(value).length;

const EMPTY = Object.freeze({ title: '', text: '', spoiler: false });

export class ReviewForm extends Component {
  static template = template;
  declare element: HTMLFormElement & {
    elements: HTMLFormControlsCollection & {
      title: HTMLInputElement;
      text: HTMLTextAreaElement;
      spoiler: HTMLInputElement;
      counter: HTMLOutputElement;
      save: HTMLButtonElement;
    };
  };

  #busy = false;
  #submitError = '';
  #shown = null;

  get #saved() {
    return myReview(this.props.film.id);
  }

  #savedValues() {
    const saved = this.#saved;
    return saved ? { title: saved.title, text: saved.text, spoiler: saved.spoiler } : EMPTY;
  }

  context() {
    const values = reviewDraft(this.props.film.id) ?? this.#savedValues();
    return {
      ...values,
      editing: Boolean(this.#saved),
      canCancel: Boolean(this.props.onCancel),
      what: this.props.film.isSeries ? 'сериал' : 'фильм',
    };
  }

  onRender() {
    const { title, text, spoiler } = this.element.elements;
    limitTextInput(title, MAX_REVIEW_TITLE_LENGTH, {
      onLimit: () => notify(`Заголовок не длиннее ${MAX_REVIEW_TITLE_LENGTH} символов.`),
    });
    limitTextInput(text, Limit.TEXT_HARD_MAX, {
      onLimit: () => notify(`Отзыв не длиннее ${Limit.TEXT_HARD_MAX} символов.`),
    });
    const onEdit = () => {
      this.#submitError = '';
      this.#refresh();
    };
    this.on('input', onEdit, title);
    this.on('input', onEdit, text);
    this.on('change', onEdit, spoiler);
    this.on('submit', (event) => this.#save(event));
    this.delegate('click', '[name="delete"]', () => this.#remove());
    this.delegate('click', '[name="cancel"]', () => this.props.onCancel());
    this.watch(store.watch('myReview', () => !this.#busy && !this.#edited() && this.update()));
    this.watch(store.watch('onlineconf', () => this.#refresh()));
    this.watch(eventBus.on('route:before-refresh', (event: Event) => {
      if (this.#busy || this.#edited()) {
        event.preventDefault();
        this.#showSyncStatus();
      }
    }));
    this.#shown = this.#inputValues();
    this.#showSyncStatus();
    this.#refresh();
  }

  focus() {
    const { text } = this.element.elements;
    text.focus();
    text.setSelectionRange(text.value.length, text.value.length);
  }

  #inputValues() {
    const { title, text, spoiler } = this.element.elements;
    return { title: title.value, text: text.value, spoiler: spoiler.checked };
  }

  #values() {
    const { title, text, spoiler } = this.#inputValues();
    return { title: title.trim(), text: text.trim(), spoiler };
  }

  #showSyncStatus() {
    const pending = pendingFilmEdit(this.props.film.id, 'review');
    const message = pending?.conflict
      ? pending.rejectionReason ?? 'Изменение осталось на этом устройстве. Проверьте актуальную версию отзыва перед отправкой.'
      : pending ? 'Изменение ждёт подключения к сети.' : '';
    const hint = this.find('[data-sync-status]');
    hint.textContent = message;
    hint.hidden = !message;
  }

  #differs(a, b) {
    return a.title !== b.title || a.text !== b.text || a.spoiler !== b.spoiler;
  }

  #edited() {
    return this.#differs(this.#inputValues(), this.#shown);
  }

  #canSave(values, textLength = length(values.text)) {
    const { writeEnabled, maxLength } = store.get('onlineconf');
    return writeEnabled && !this.#busy && isValidReviewTitle(values.title) &&
      textLength >= Limit.TEXT_MIN && textLength <= maxLength &&
      this.#differs(values, this.#savedValues());
  }

  #writeHint() {
    const { writeEnabled, status } = store.get('onlineconf');
    if (writeEnabled) return '';
    if (status === 'loading') return 'Проверяем, доступна ли отправка отзыва…';
    if (status === 'fallback') return 'Не удалось проверить, доступна ли отправка отзыва. Попробуйте позже.';
    return 'Публикация и редактирование отзывов временно недоступны.';
  }

  #hint(textLength: number, max: number) {
    const missing = Limit.TEXT_MIN - textLength;
    if (missing > 0) return `Ещё ${countLabel(missing, ['символ', 'символа', 'символов'])}`;
    if (textLength > max) return `Сократите отзыв на ${countLabel(textLength - max, ['символ', 'символа', 'символов'])}.`;
    return '';
  }

  #refresh() {
    const { counter, save, text, title } = this.element.elements;
    const values = this.#values();
    const invalidTitle = title.value !== '' && !isValidReviewTitle(values.title);
    this.find('#review-title-hint').hidden = !invalidTitle;
    title.setAttribute('aria-invalid', String(invalidTitle));
    const textLength = length(values.text);
    const max = store.get('onlineconf').maxLength;
    const count = `${textLength} / ${max}`;
    if (counter.value !== count) counter.value = count;
    const hint = this.find('[data-length-hint]');
    const message = this.#hint(textLength, max);
    if (hint.textContent !== message) hint.textContent = message;
    hint.hidden = !message;
    const writeHint = this.find('[data-write-hint]');
    const writeMessage = this.#writeHint();
    if (writeHint.textContent !== writeMessage) writeHint.textContent = writeMessage;
    writeHint.hidden = !writeMessage;
    const errorHint = this.find('[data-submit-error]');
    if (errorHint.textContent !== this.#submitError) errorHint.textContent = this.#submitError;
    errorHint.hidden = !this.#submitError;
    text.setAttribute('aria-invalid', String(textLength > max));
    save.disabled = !this.#canSave(values, textLength);
  }

  async #run(action, done) {
    this.#submitError = '';
    this.#setBusy(true);
    let succeeded = false;
    try {
      const queued = await action();
      succeeded = true;
      notify(queued ? 'Отправим изменение после подключения к сети.' : done, { type: 'success' });
      if (!queued) this.props.onDone?.();
    } catch (error) {
      if (!this.element) return;
      const reason = reviewPolicyErrorMessage(error);
      if (reason) {
        this.#submitError = reason;
        this.#refresh();
      } else {
        notify(errorMessage(error), { type: 'error' });
      }
    } finally {
      if (this.element) {
        this.#setBusy(false);
        if (succeeded) this.update();
      }
    }
  }

  #setBusy(busy: boolean) {
    this.#busy = busy;
    const { title, text, spoiler } = this.element.elements;
    title.readOnly = text.readOnly = busy;
    spoiler.disabled = busy;
    for (const action of this.findAll<HTMLButtonElement>('button[type="button"]')) action.disabled = busy;
    this.#refresh();
  }

  #save(event) {
    event.preventDefault();
    const values = this.#values();
    if (!this.#canSave(values)) return;
    const editing = Boolean(this.#saved);
    this.#run(
      () => saveReview(this.props.film.id, values),
      editing ? 'Отзыв сохранён.' : 'Отзыв опубликован.',
    );
  }

  #remove() {
    if (this.#busy) return;
    this.#run(() => removeReview(this.props.film.id), 'Отзыв удалён.');
  }
}
