import './logo.css';
import templateSource from './Logo.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const mark = new URL('../../assets/images/logo-mark.svg', import.meta.url).href;
const letter = new URL('../../assets/images/logo-f.svg', import.meta.url).href;
const word = new URL('../../assets/images/logo-rame.svg', import.meta.url).href;
const mobile = new URL('../../assets/images/logo-mobile.svg', import.meta.url).href;
const template = await loadAssets({ template: templateSource });

export class Logo extends Component {
  static template = template;

  context() {
    return { mark, letter, word, mobile, ...this.props };
  }
}
