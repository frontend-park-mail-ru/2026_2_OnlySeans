import { BaseComponent } from '../base-component.js';

const template = window.Handlebars.compile(`
  <div class="modal">
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-label="{{label}}">
      <button class="modal__close" type="button" aria-label="Закрыть">×</button>
      <div class="modal__content"></div>
    </div>
  </div>
`);

export class Modal extends BaseComponent {
  constructor({ label, onClose }) {
    super(template, { label });
    this.onClose = onClose;
  }

  create() {
    if (this.element) return this.element;

    const element = super.create();
    const onKeydown = (event) => {
      if (!element.isConnected) {
        document.removeEventListener('keydown', onKeydown);
        return;
      }
      if (event.key === 'Escape') close();
    };
    const close = () => {
      document.removeEventListener('keydown', onKeydown);
      this.remove();
      if (this.onClose) this.onClose();
    };

    document.addEventListener('keydown', onKeydown);
    element.querySelector('.modal__close').addEventListener('click', close);
    element.addEventListener('mousedown', (event) => {
      if (event.target === element) close();
    });

    return element;
  }
}

export const createModal = (props) => new Modal(props).render();
