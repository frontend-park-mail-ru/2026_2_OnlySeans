import './status-message.css';
import templateSource from './StatusMessage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class StatusMessage extends Component {
  static template = template;

  context() {
    return { text: this.props.text, canRetry: Boolean(this.props.retry) };
  }

  onRender() {
    if (this.props.retry) this.delegate('click', '.status-message__retry', this.props.retry);
  }
}
