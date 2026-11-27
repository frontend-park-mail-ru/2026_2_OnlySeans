import './review-form.css';
import templateSource from './ReviewForm.hbs';
import { Component } from '../../../../core/component.js';
import { store } from '../../../../core/store.js';
import { errorMessage } from '../../../../api/errors.js';
import { myReview, removeReview, reviewDraft, saveReview } from '../../../../services/my-review.js';
import { pendingFilmEdit } from '../../../../services/offline-film-edits.js';
import { limitTextInput } from '../../../../services/text-limit.js';
import { countLabel } from '../../../../core/format.js';
import { notify } from '../../../../services/notice.js';
import { loadAssets } from '../../../../core/assets.js';
import { REVIEW_LIMITS, reviewErrors } from '../../../../services/review-validation.js';
import type { Film } from '../../../../api/films.js';
import type { ReviewValues } from '../../../../api/reviews.js';
import { ConfirmDialog } from '../../../../components/confirm-dialog/ConfirmDialog.js';

const template = await loadAssets({ template: templateSource });

const Limit = Object.freeze({
  TITLE_MIN: REVIEW_LIMITS.titleMin,
  TITLE_MAX: REVIEW_LIMITS.titleMax,
  TEXT_MIN: 50,
  TEXT_MAX: 20000,
});

const length = (value: string) => Array.from(value).length;

const EMPTY = Object.freeze({ title: '', text: '', spoiler: false });
let nextFormId = 0;

export class ReviewForm extends Component<{
  film: Film;
  onCancel?: () => void;
  onDone?: () => void;
}> {
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
  #draft: ReviewValues | null = null;
  #shown: ReviewValues = EMPTY;
  #touched = new Set<string>();
  #error = '';
  #id = `review-form-${++nextFormId}`;
  #confirmation: ConfirmDialog | null = null;

  get #saved() {
    return myReview(this.props.film.id);
  }

  #savedValues() {
    const saved = this.#saved;
    return saved ? { title: saved.title, text: saved.text, spoiler: saved.spoiler } : EMPTY;
  }

  context() {
    const values = this.#draft ?? reviewDraft(this.props.film.id) ?? this.#savedValues();
    const pending = pendingFilmEdit(this.props.film.id, 'review');
    return {
      ...values,
      id: this.#id,
      error: this.#error,
      syncStatus: pending?.conflict
        ? 'Изменение осталось на этом устройстве. Проверьте актуальную версию отзыва перед отправкой.'
        : pending
          ? 'Изменение ждёт подключения к сети.'
          : '',
      editing: Boolean(this.#saved),
      busy: this.#busy,
      canCancel: Boolean(this.props.onCancel),
      what: this.props.film.isSeries ? 'сериал' : 'фильм',
    };
  }

  onRender() {
    const { title, text, spoiler } = this.element.elements;
    spoiler.checked = Boolean(this.context().spoiler);
    this.findAll<HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement>(
      'input, textarea, button',
    ).forEach((control) => {
      control.disabled = this.#busy;
    });
    limitTextInput(title, Limit.TITLE_MAX, {
      onLimit: () => notify(`Заголовок не длиннее ${Limit.TITLE_MAX} символов.`),
    });
    limitTextInput(text, Limit.TEXT_MAX, {
      onLimit: () => notify(`Отзыв не длиннее ${Limit.TEXT_MAX} символов.`),
    });
    for (const field of [title, text]) {
      const changed = () => {
        this.#touched.add(field.name);
        this.#error = '';
        this.find('[data-error]').textContent = '';
        this.#refresh();
      };
      this.on('input', changed, field);
      this.on('blur', changed, field);
    }
    this.on('change', () => this.#refresh(), spoiler);
    this.on('submit', (event) => this.#save(event));
    this.delegate('click', '[name="delete"]', () => {
      if (this.#busy || this.#confirmation) return;
      this.#confirmation = new ConfirmDialog({
        title: 'Удалить отзыв?',
        text: 'Оценка фильма останется. Удаление отзыва можно будет отменить в уведомлении.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        danger: true,
        resolve: (confirmed: boolean) => {
          this.#confirmation = null;
          if (confirmed && !this.destroyed) this.#remove();
        },
      }).open();
    });
    this.watch(() => this.#confirmation?.close());
    this.delegate('click', '[name="cancel"]', () => this.props.onCancel?.());
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

  #differs(a: ReviewValues, b: ReviewValues) {
    return a.title !== b.title || a.text !== b.text || a.spoiler !== b.spoiler;
  }

  #edited() {
    return this.#differs(this.#values(), this.#shown);
  }

  #valid({ title, text }: Pick<ReviewValues, 'title' | 'text'>) {
    const errors = reviewErrors({ title, text });
    return !errors.title && !errors.text;
  }

  #hint(text: string) {
    const missing = Limit.TEXT_MIN - length(text);
    if (missing > 0) return `Ещё ${countLabel(missing, ['символ', 'символа', 'символов'])}`;
    return `${length(text)} / ${Limit.TEXT_MAX}`;
  }

  #refresh() {
    const { counter, save } = this.element.elements;
    const values = this.#values();
    const errors = reviewErrors(values);
    for (const name of ['title', 'text'] as const) {
      const message = this.#touched.has(name) ? errors[name] : '';
      this.element.elements[name].setAttribute('aria-invalid', String(Boolean(message)));
      this.find(`[data-field-error="${name}"]`).textContent = message;
    }
    counter.value = this.#hint(values.text);
    save.disabled =
      this.#busy || !this.#valid(values) || !this.#differs(values, this.#savedValues());
  }

  async #run(action: () => Promise<boolean>, done: string) {
    this.#busy = true;
    this.#error = '';
    this.update();
    try {
      const queued = await action();
      this.#draft = null;
      if (queued || done)
        notify(queued ? 'Отправим изменение после подключения к сети.' : done, { type: 'success' });
      if (!queued) this.props.onDone?.();
    } catch (error) {
      this.#error = errorMessage(error);
      notify(errorMessage(error), { type: 'error' });
    } finally {
      this.#busy = false;
      if (!this.destroyed) this.update();
    }
  }

  #save(event: Event) {
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
    const values = this.#savedValues();
    const userId = store.get('user')?.id;
    this.#draft = EMPTY;
    this.#run(async () => {
      const queued = await removeReview(this.props.film.id);
      if (!queued) {
        const expires = Date.now() + 5000;
        notify('Отзыв удалён.', {
          type: 'success',
          duration: 5000,
          action: {
            label: 'Отменить',
            run: async () => {
              if (
                Date.now() > expires ||
                store.get('user')?.id !== userId ||
                myReview(this.props.film.id)
              )
                return;
              try {
                const queued = await saveReview(this.props.film.id, values);
                notify(
                  queued ? 'Восстановим отзыв после подключения к сети.' : 'Отзыв восстановлен.',
                  { type: queued ? 'info' : 'success' },
                );
              } catch (error) {
                notify(errorMessage(error), { type: 'error' });
              }
            },
          },
        });
      }
      return queued;
    }, '');
  }
}
