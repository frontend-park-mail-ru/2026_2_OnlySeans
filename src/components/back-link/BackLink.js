import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./back-link.css', import.meta.url));
const template = await loadTemplate(new URL('./BackLink.hbs', import.meta.url));

export class BackLink extends Component {
  static template = template;
}
