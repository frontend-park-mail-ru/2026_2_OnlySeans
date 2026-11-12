import './logo.css';
import templateSource from './Logo.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const mark = new URL('../../assets/images/logo-mark.svg', import.meta.url).href;
const template = await loadAssets({ template: templateSource });

export class Logo extends Component {
  static template = template;

  context() {
    return { mark };
  }
}
