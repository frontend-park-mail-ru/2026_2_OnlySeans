import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

const star = new URL('../../assets/images/section-star.svg', import.meta.url).href;
loadStyles(new URL('./section-heading.css', import.meta.url));
const template = await loadTemplate(new URL('./SectionHeading.hbs', import.meta.url));

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
