import { Component } from '../../core/component.js';
import { loadStyles } from '../../core/assets.js';

loadStyles(new URL('./modal.css', import.meta.url));

export class Modal extends Component {
  open() {
    document.body.append(this.render());
    this.on('close', () => this.destroy());
    this.on('click', (event) => {
      if (event.target === this.element) this.close();
    });
    this.element.showModal();
    return this;
  }

  close() {
    this.element?.close();
  }
}
