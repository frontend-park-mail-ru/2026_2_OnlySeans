import './section-heading.css';
import templateSource from './SectionHeading.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const star = new URL('../../assets/images/section-star.svg', import.meta.url).href;
const template = await loadAssets({ template: templateSource });

export class SectionHeading extends Component {
  static template = template;

  context() {
    return { ...this.props, tag: this.props.level === 1 ? 'h1' : 'h2', star };
  }

  onRender() {
    if (this.props.tools) this.insert('tools', this.props.tools);
    else this.find('[data-slot="tools"]').remove();
  }
}
