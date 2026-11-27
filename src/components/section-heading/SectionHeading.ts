import './section-heading.css';
import templateSource from './SectionHeading.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { readAppearance } from '../../services/appearance.js';
import { watchPreferences } from '../../services/storage.js';

const star = new URL('../../assets/images/section-star.svg', import.meta.url).href;
const template = await loadAssets({ template: templateSource });
const button = new URL('../../assets/images/coraline/button.svg', import.meta.url).href;

export class SectionHeading extends Component {
  static template = template;

  context() {
    return {
      ...this.props,
      primary: this.props.level === 1,
      star: readAppearance().cinema === 'coraline' ? button : star,
    };
  }

  onRender() {
    const cinema = readAppearance().cinema;
    this.watch(
      watchPreferences(() => {
        if (readAppearance().cinema !== cinema) this.update();
      }),
    );
    if (this.props.tools) this.insert('tools', this.props.tools);
    else this.find('[data-slot="tools"]').remove();
  }
}
