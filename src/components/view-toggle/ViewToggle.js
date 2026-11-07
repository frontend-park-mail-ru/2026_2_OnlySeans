import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./view-toggle.css', import.meta.url));
const template = await loadTemplate(new URL('./ViewToggle.hbs', import.meta.url));

const OPTIONS = [
  { value: 'grid', label: 'Сетка', icon: 'grid' },
  { value: 'list', label: 'Список', icon: 'list' },
];

export class ViewToggle extends Component {
  static template = template;

  context() {
    return {
      options: OPTIONS.map((option) => ({ ...option, active: option.value === this.props.view })),
    };
  }

  onRender() {
    this.delegate('click', '[data-view]', (event, button) => {
      if (button.dataset.view === this.props.view) return;
      this.update({ view: button.dataset.view });
      this.find(`[data-view="${this.props.view}"]`).focus();
      this.props.onChange(this.props.view);
    });
  }
}
