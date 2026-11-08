import { Modal } from '../modal/Modal.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./name-dialog.css', import.meta.url));
const template = await loadTemplate(new URL('./NameDialog.hbs', import.meta.url));

export class NameDialog extends Modal {
  static template = template;

  onRender() {
    const input = this.find('.name-dialog__input');
    const error = this.find('.name-dialog__error');
    this.on('input', () => (error.textContent = ''), input);
    this.delegate('click', '[data-cancel]', () => this.close());
    this.delegate('submit', '.name-dialog__form', (event) => {
      event.preventDefault();
      try {
        this.props.save(input.value);
        this.close();
      } catch (problem) {
        error.textContent = problem.message;
        input.focus();
      }
    });
  }

  open() {
    super.open();
    const input = this.find('.name-dialog__input');
    input.focus();
    input.select();
    return this;
  }
}
