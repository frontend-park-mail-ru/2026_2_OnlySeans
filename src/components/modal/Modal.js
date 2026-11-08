import './modal.css';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

loadAssets({});

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
