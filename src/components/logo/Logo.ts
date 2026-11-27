import './logo.css';
import templateSource from './Logo.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { readAppearance } from '../../services/appearance.js';
import { watchPreferences } from '../../services/storage.js';

const mark = new URL('../../assets/images/logo-mark.svg', import.meta.url).href;
const letter = new URL('../../assets/images/logo-f.svg', import.meta.url).href;
const word = new URL('../../assets/images/logo-rame.svg', import.meta.url).href;
const mobile = new URL('../../assets/images/logo-mobile.svg', import.meta.url).href;
const template = await loadAssets({ template: templateSource });
const coralineMark = new URL('../../assets/images/coraline/mark.svg', import.meta.url).href;
const coralineLetter = new URL('../../assets/images/coraline/letter.svg', import.meta.url).href;
const coralineWord = new URL('../../assets/images/coraline/word.svg', import.meta.url).href;

export class Logo extends Component {
  static template = template;

  context() {
    const coraline = readAppearance().cinema === 'coraline';
    return {
      mark: coraline ? coralineMark : mark,
      letter: coraline ? coralineLetter : letter,
      word: coraline ? coralineWord : word,
      coraline,
      mobile,
      ...this.props,
    };
  }
  onRender() {
    const cinema = readAppearance().cinema;
    this.watch(
      watchPreferences(() => {
        if (readAppearance().cinema !== cinema) this.update();
      }),
    );
  }
}
