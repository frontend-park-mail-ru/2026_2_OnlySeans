import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./button.css', import.meta.url));
const template = await loadTemplate(new URL('./Button.hbs', import.meta.url));

export class Button extends Component {
  static template = template;

  context() {
    return { variant: 'primary', type: 'button', ...this.props };
  }

  onRender() {
    if (this.props.onClick) this.on('click', this.props.onClick);
  }
}
