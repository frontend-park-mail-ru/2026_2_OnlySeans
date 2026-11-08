import './name-dialog.css';
import templateSource from './NameDialog.hbs';
import { Modal } from '../modal/Modal.js';
import { loadTemplate } from '../../core/assets.js';


const template = await loadTemplate(templateSource);

export class NameDialog extends Modal {
  static template = template;

  onRender() {
    const input = this.find('.name-dialog__input');
    const error = this.find('.name-dialog__error');
    this.on('input', () => (error.textContent = ''), input);
    this.delegate('click', '[data-cancel]', () => this.close());
    this.delegate('submit', '.name-dialog__form', async (event) => {
      event.preventDefault();
      try {
        await this.props.save(input.value);
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
