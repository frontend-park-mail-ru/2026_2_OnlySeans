import templateSource from './ConfirmDialog.hbs';
import { Modal } from '../modal/Modal.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

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
