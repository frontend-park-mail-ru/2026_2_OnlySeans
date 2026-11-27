import './admin-delete-dialog.css';
import templateSource from './AdminDeleteDialog.hbs';
import { Modal } from '../modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import { adminError } from '../../api/admin.js';
import type { Film } from '../../api/films.js';

const template = await loadAssets({ template: templateSource });

/** Подтверждение остаётся открытым при ошибке, повторное удаление блокируется. */
export class AdminDeleteDialog extends Modal {
  static template = template;
  #busy = false;

  static ask(film: Film, remove: () => Promise<void>): Promise<boolean> {
    return new Promise((resolve) => new AdminDeleteDialog({ film, remove, resolve }).open());
  }

  onRender() {
    let removed = false;
    this.delegate('click', '[data-cancel]', () => {
      if (!this.#busy) this.close();
    });
    this.delegate('click', '[data-delete]', async () => {
      if (this.#busy) return;
      this.#busy = true;
      this.#setBusy(true);
      this.find('[data-error]').textContent = '';
      try {
        await this.props.remove();
        removed = true;
        this.#busy = false;
        this.close();
      } catch (error) {
        this.find('[data-error]').textContent = adminError(error);
        this.#busy = false;
        this.#setBusy(false);
      }
    });
    this.on('cancel', (event) => {
      if (this.#busy) event.preventDefault();
    });
    this.on('close', () => this.props.resolve(removed));
  }

  #setBusy(busy: boolean) {
    this.element.setAttribute('aria-busy', String(busy));
    this.findAll<HTMLButtonElement>('button').forEach((button) => (button.disabled = busy));
    this.find('[data-delete]').textContent = busy ? 'Удаляем…' : 'Удалить фильм';
  }

  open() {
    super.open();
    this.find('[data-cancel]').focus();
    return this;
  }

  close() {
    if (!this.#busy) super.close();
  }
}
