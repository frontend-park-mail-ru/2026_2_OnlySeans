import templateSource from './Toast.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { Notice } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });

const ICONS = { error: 'alert', success: 'check', info: 'info' };

export class Toast extends Component<Notice & { onClose(): void }> {
  static template = template;

  context() {
    return { ...this.props, iconName: ICONS[this.props.type] || 'info' };
  }

  onRender() {
    this.delegate('click', '.toast__close', () => this.props.onClose());
    this.delegate('click', '.toast__action', () => {
      this.props.onClose();
      this.props.action?.run?.();
    });
  }
}
