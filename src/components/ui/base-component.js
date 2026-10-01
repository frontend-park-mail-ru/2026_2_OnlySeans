import { renderTemplate } from './render-template.js';

export class BaseComponent {
  constructor(template, props) {
    this.template = template;
    this.props = props;
    this.element = null;
  }

  create() {
    if (!this.element) {
      this.element = renderTemplate(this.template, this.props);
    }

    return this.element;
  }

  mount(parent) {
    const element = this.create();
    parent.appendChild(element);
    return element;
  }

  remove() {
    this.element?.remove();
    this.element = null;
  }

  render() {
    return this.create();
  }
}