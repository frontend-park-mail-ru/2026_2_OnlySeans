import templateSource from './ShelfEditor.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { loadAssets } from '../../core/assets.js';
import { deleteShelf, saveShelf, shelfNameError, type Shelf } from '../../services/shelves.js';

const template = await loadAssets({ template: templateSource });

/** Редактор сохраняет введённое название при ошибке локального хранилища. */
export class ShelfEditor extends Modal {
  static template = template;
  #confirm: ConfirmDialog | null = null;
  constructor(props: { shelf?: Shelf; onSaved?(shelf: Shelf | null): void }) {
    super(props);
  }

  context() {
    return {
      shelf: this.props.shelf,
      edit: Boolean(this.props.shelf),
      closeDesktop: new URL('../../assets/images/shelf-close-desktop.svg', import.meta.url).href,
      closeMobile: new URL('../../assets/images/shelf-close-mobile.svg', import.meta.url).href,
    };
  }

  onRender() {
    const input = this.find<HTMLInputElement>('input');
    const message = this.find('[data-error]');
    const validate = (show: boolean) => {
      const error = shelfNameError(input.value, this.props.shelf?.id);
      message.textContent = show ? error : '';
      input.setAttribute('aria-invalid', String(show && Boolean(error)));
      this.find('button[type=submit]').classList.toggle('is-invalid', Boolean(error));
      this.find('[data-count]').textContent = `${[...input.value].length} / 40`;
      return error;
    };
    this.on('input', () => validate(true), input);
    this.on('blur', () => validate(true), input);
    this.delegate('click', '[data-close]', () => this.close());
    this.on('submit', (event) => {
      event.preventDefault();
      if (validate(true)) {
        input.focus();
        return;
      }
      try {
        const shelf = saveShelf(input.value, this.props.shelf?.id);
        this.close();
        this.props.onSaved?.(shelf);
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'Не удалось сохранить полку';
      }
    });
    this.delegate('click', '[data-delete]', () => {
      if (this.#confirm) return;
      this.#confirm = new ConfirmDialog({
        title: 'Удалить полку?',
        text: 'Фильмы останутся в избранном.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        danger: true,
        resolve: (confirmed: boolean) => {
          this.#confirm = null;
          if (!confirmed || this.destroyed) return;
          try {
            deleteShelf(this.props.shelf.id);
            this.close();
            this.props.onSaved?.(null);
          } catch (error) {
            message.textContent =
              error instanceof Error ? error.message : 'Не удалось удалить полку';
          }
        },
      }).open();
    });
    validate(false);
  }
  destroy() {
    this.#confirm?.close();
    super.destroy();
  }
}
