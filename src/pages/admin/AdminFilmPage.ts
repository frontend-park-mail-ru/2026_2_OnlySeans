import './admin-page.css';
import templateSource from './AdminFilmPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';
import type { Film } from '../../api/films.js';
import { ApiError } from '../../api/http.js';
import {
  getAdminFilm,
  createFilm,
  updateFilm,
  deleteFilm,
  uploadPoster,
  deletePoster,
  adminError,
} from '../../api/admin.js';
import {
  filmFields,
  filmInput,
  validateFilm,
  posterError,
  type FilmFields,
} from '../../services/admin-film.js';
import { TextField } from '../../components/text-field/TextField.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { AdminDeleteDialog } from '../../components/admin-delete-dialog/AdminDeleteDialog.js';
import { invalidateCatalog } from '../../services/catalog.js';
import { notify } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });
type FieldName = 'title' | 'original_title' | 'release_year' | 'duration_min';
const FIELDS: { name: FieldName; label: string; numeric?: boolean }[] = [
  { name: 'title', label: 'Название *' },
  { name: 'original_title', label: 'Оригинальное название' },
  { name: 'release_year', label: 'Год выпуска *', numeric: true },
  { name: 'duration_min', label: 'Длительность, мин', numeric: true },
];

/** Создание и редактирование используют один набор полей и отдельную операцию с постером. */
export class AdminFilmPage extends Component<PageProps> {
  static template = template;
  #id: number | null;
  #film?: Film;
  #loading = true;
  #loadError = '';
  #fields: FilmFields = filmFields();
  #inputs = new Map<FieldName, TextField>();
  #baseline = '';
  #file: File | null = null;
  #removePoster = false;
  #preview = '';
  #busy = false;
  #checkingPoster = false;
  #posterRevision = 0;
  #controller = new AbortController();
  #leaveDialog: Promise<boolean> | null = null;

  constructor(props: PageProps) {
    super(props);
    this.#id = props.params.id ? Number(props.params.id) : null;
  }

  context() {
    return {
      editing: this.#id !== null,
      id: this.#id,
      film: this.#film,
      loading: this.#loading,
      loadError: this.#loadError,
    };
  }

  onRender() {
    if (this.#loading) {
      void this.#load();
      return;
    }
    if (this.#loadError) {
      this.delegate('click', '[data-retry]', () => {
        this.#loading = true;
        this.update();
      });
      return;
    }
    this.#inputs.clear();
    for (const field of FIELDS) {
      const input = this.insert(
        field.name,
        new TextField({
          ...field,
          maxLength: field.numeric ? 4 : 255,
          autocomplete: 'off',
        }),
      );
      input.input.value = this.#fields[field.name];
      if (field.numeric) input.input.inputMode = 'numeric';
      this.#inputs.set(field.name, input);
      input.on('input', () => this.#validate(false));
      input.on('blur', () => this.#validate(true), input.input);
    }
    this.find<HTMLSelectElement>('[name=film_type]').value = this.#fields.film_type;
    this.find<HTMLSelectElement>('[name=age_limit]').value = this.#fields.age_limit;
    this.find<HTMLTextAreaElement>('[name=description]').value = this.#fields.description;
    this.#baseline = JSON.stringify(this.#readFields());
    this.#syncType();
    this.#syncPoster();
    this.delegate('submit', 'form', (event) => {
      event.preventDefault();
      void this.#save();
    });
    this.delegate('change', '[name=film_type]', () => {
      this.#syncType();
      this.#validate(false);
    });
    this.delegate('change', '[name=age_limit]', () => this.#validate(true));
    this.delegate('input', 'textarea', () => this.#validate(false));
    this.delegate('change', '[name=poster]', () => void this.#selectPoster());
    this.delegate('click', '[data-remove-poster]', () => {
      this.#posterRevision++;
      this.#checkingPoster = false;
      this.#file = null;
      this.#removePoster = Boolean(this.#film?.poster);
      this.#clearPreview();
      this.find<HTMLInputElement>('[name=poster]').value = '';
      this.find('[data-poster-error]').textContent = '';
      this.#syncPoster();
    });
    this.delegate('click', '[data-delete-film]', () => void this.#delete());
    this.on(
      'beforeunload',
      (event) => {
        if (this.#dirty() || this.#busy) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      window,
    );
    this.watch(() => {
      this.#controller.abort();
      this.#clearPreview();
    });
  }

  async #load() {
    try {
      if (this.#id !== null) {
        if (!Number.isSafeInteger(this.#id) || this.#id <= 0)
          throw new ApiError(404, 'film not found');
        this.#film = await getAdminFilm(this.#id, this.#controller.signal);
        this.#fields = filmFields(this.#film);
      }
      this.#loadError = '';
    } catch (error) {
      this.#loadError = adminError(error);
    }
    if (this.destroyed) return;
    this.#loading = false;
    this.update();
  }

  #readFields(): FilmFields {
    return {
      title: this.#inputs.get('title')!.input.value,
      original_title: this.#inputs.get('original_title')!.input.value,
      release_year: this.#inputs.get('release_year')!.input.value.trim(),
      duration_min: this.#inputs.get('duration_min')!.input.value.trim(),
      film_type: this.find<HTMLSelectElement>('[name=film_type]').value,
      age_limit: this.find<HTMLSelectElement>('[name=age_limit]').value,
      description: this.find<HTMLTextAreaElement>('[name=description]').value,
    };
  }

  #syncType() {
    const series = this.find<HTMLSelectElement>('[name=film_type]').value === 'series';
    this.#inputs.get('duration_min')!.setDisabled(series);
    this.find('[data-duration-note]').hidden = !series;
    if (series) this.#inputs.get('duration_min')!.setError('');
  }

  #validate(show: boolean) {
    const errors = validateFilm(this.#readFields());
    for (const [name, input] of this.#inputs) {
      if (show || input.input.getAttribute('aria-invalid') === 'true')
        input.setError(errors[name] || '');
    }
    for (const name of ['film_type', 'age_limit', 'description'] as const) {
      const input = this.find(`[name=${name}]`);
      if (show || input.getAttribute('aria-invalid') === 'true') {
        input.setAttribute('aria-invalid', String(Boolean(errors[name])));
        this.find(`[data-error-for=${name}]`).textContent = errors[name] || '';
      }
    }
    return !Object.keys(errors).length;
  }

  async #selectPoster() {
    const input = this.find<HTMLInputElement>('[name=poster]');
    const file = input.files?.[0];
    if (!file) return;
    const revision = ++this.#posterRevision;
    let message = posterError(file);
    const url = message ? '' : URL.createObjectURL(file);
    this.#checkingPoster = true;
    try {
      if (!message) {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (image.naturalWidth > 4096 || image.naturalHeight > 4096)
          message = 'Размер изображения не должен превышать 4096 × 4096 пикселей.';
      }
    } catch {
      message = 'Не удалось прочитать изображение. Выберите другой файл.';
    }
    if (this.destroyed || revision !== this.#posterRevision) {
      if (url) URL.revokeObjectURL(url);
      return;
    }
    this.#checkingPoster = false;
    this.find('[data-poster-error]').textContent = message;
    if (message) {
      if (url) URL.revokeObjectURL(url);
      input.value = '';
      return;
    }
    this.#clearPreview();
    this.#preview = url;
    this.#file = file;
    this.#removePoster = false;
    this.#syncPoster();
  }

  #clearPreview() {
    if (this.#preview) URL.revokeObjectURL(this.#preview);
    this.#preview = '';
  }

  #syncPoster() {
    const url = this.#preview || (!this.#removePoster && this.#film?.poster) || '';
    const image = this.find<HTMLImageElement>('[data-poster-preview]');
    image.hidden = !url;
    if (url) image.src = url;
    else image.removeAttribute('src');
    this.find('[data-poster-placeholder]').hidden = Boolean(url);
    this.find<HTMLButtonElement>('[data-remove-poster]').hidden = !url;
    this.find('[data-poster-caption]').textContent = this.#file
      ? this.#file.name
      : this.#removePoster
        ? 'Постер будет удалён при сохранении.'
        : 'JPEG или PNG, до 5 МБ и 4096 × 4096 пикселей.';
  }

  #dirty() {
    return Boolean(
      this.#baseline &&
        !this.#loadError &&
        !this.#loading &&
        (JSON.stringify(this.#readFields()) !== this.#baseline || this.#file || this.#removePoster),
    );
  }

  /** Router вызывает проверку перед SPA-переходами и переходами назад/вперёд. */
  beforeLeave(): boolean | Promise<boolean> {
    if (this.#busy) return false;
    if (!this.#dirty()) return true;
    this.#leaveDialog ??= ConfirmDialog.ask({
      title: 'Есть несохранённые изменения',
      text: 'Если уйти со страницы, изменения будут потеряны.',
      confirmText: 'Уйти без сохранения',
      cancelText: 'Остаться',
      danger: true,
    }).finally(() => {
      this.#leaveDialog = null;
    });
    return this.#leaveDialog;
  }

  #setBusy(busy: boolean) {
    this.#busy = busy;
    this.find<HTMLFieldSetElement>('fieldset').disabled = busy;
    this.find<HTMLButtonElement>('[data-save]').disabled = busy;
    this.find('[data-save]').textContent = busy
      ? 'Сохраняем…'
      : this.#id
        ? 'Сохранить изменения'
        : 'Создать фильм';
    this.find('form').setAttribute('aria-busy', String(busy));
  }

  async #save() {
    if (this.#busy || this.#checkingPoster) return;
    if (!this.#validate(true)) {
      this.query<HTMLElement>('[aria-invalid=true]')?.focus();
      return;
    }
    this.#fields = this.#readFields();
    this.find('[data-save-error]').textContent = '';
    this.#setBusy(true);
    let detailsSaved = false;
    try {
      if (this.#id === null) {
        this.#id = await createFilm(filmInput(this.#fields));
        history.replaceState(history.state, '', `/admin/films/${this.#id}/edit`);
        this.find('h1').textContent = 'Редактирование фильма';
        this.find('[data-film-reference]').textContent = `${this.#fields.title} · ID ${this.#id}`;
      } else await updateFilm(this.#id, filmInput(this.#fields));
      detailsSaved = true;
      invalidateCatalog();
      this.#baseline = JSON.stringify(this.#fields);
      if (this.#file) await uploadPoster(this.#id, this.#file);
      else if (this.#removePoster) await deletePoster(this.#id);
      this.#file = null;
      this.#removePoster = false;
      invalidateCatalog();
      notify('Фильм сохранён', { type: 'success' });
      this.#setBusy(false);
      this.props.navigate('/admin');
    } catch (error) {
      invalidateCatalog();
      this.find('[data-save-error]').textContent =
        (detailsSaved
          ? `Данные фильма (ID ${this.#id}) сохранены, но постер не обновлён. Повторите сохранение. `
          : this.#id === null && (!(error instanceof ApiError) || error.status >= 500)
            ? 'Создание не подтверждено. Проверьте каталог перед повтором, чтобы не добавить фильм дважды. '
            : '') + adminError(error);
      this.find('[data-save-error]').focus();
      this.#setBusy(false);
    }
  }

  async #delete() {
    if (!this.#film || this.#busy) return;
    const removed = await AdminDeleteDialog.ask(this.#film, async () => {
      await deleteFilm(this.#film!.id);
      invalidateCatalog();
    });
    if (!removed || this.destroyed) return;
    this.#baseline = '';
    notify('Фильм удалён', { type: 'success' });
    this.props.navigate('/admin');
  }
}
