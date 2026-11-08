import { Component } from '../../core/component.js';
import { loadTemplate } from '../../core/assets.js';

const template = await loadTemplate(new URL('./Toast.hbs', import.meta.url));

const ICONS = { error: 'alert', success: 'check', info: 'info' };

export class Toast extends Component {
  static template = template;

  context() {
    return { ...this.props, iconName: ICONS[this.props.type] || 'info' };
  }

  onRender() {
    this.delegate('click', '.toast__close', () => this.props.onClose());
    this.delegate('click', '.toast__action', () => {
      this.props.onClose();
      this.props.action.run?.();
    });
  }
}
