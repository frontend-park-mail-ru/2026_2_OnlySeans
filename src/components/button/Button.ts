import './button.css';
import templateSource from './Button.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class Button extends Component {
  static template = template;

  context() {
    return { variant: 'primary', type: 'button', ...this.props };
  }

  onRender() {
    if (this.element instanceof HTMLButtonElement)
      this.element.disabled = Boolean(this.props.disabled);
    if (this.props.onClick) this.on('click', this.props.onClick);
  }
}
