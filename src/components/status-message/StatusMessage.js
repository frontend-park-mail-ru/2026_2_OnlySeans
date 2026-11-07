import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./status-message.css', import.meta.url));
const template = await loadTemplate(new URL('./StatusMessage.hbs', import.meta.url));

export class StatusMessage extends Component {
  static template = template;

  onRender() {
    if (this.props.retry) this.delegate('click', '.status-message__retry', this.props.retry);
  }
}
