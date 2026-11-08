import { Modal } from '../modal/Modal.js';
import { loadTemplate } from '../../core/assets.js';

const template = await loadTemplate(new URL('./ConfirmDialog.hbs', import.meta.url));

export class ConfirmDialog extends Modal {
  static template = template;

  static ask(props) {
    return new Promise((resolve) => {
      new ConfirmDialog({ cancelText: 'Отмена', confirmText: 'Да', ...props, resolve }).open();
    });
  }

  onRender() {
    let answer = false;
    this.delegate('click', '[data-answer]', (event, button) => {
      answer = button.dataset.answer === 'yes';
      this.close();
    });
    this.on('close', () => this.props.resolve(answer));
  }

  open() {
    super.open();
    this.find('[data-answer="no"]').focus();
    return this;
  }
}
