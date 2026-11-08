import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

const mark = new URL('../../assets/images/logo-mark.svg', import.meta.url).href;
loadStyles(new URL('./logo.css', import.meta.url));
const template = await loadTemplate(new URL('./Logo.hbs', import.meta.url));

export class Logo extends Component {
  static template = template;

  context() {
    return { mark };
  }
}
