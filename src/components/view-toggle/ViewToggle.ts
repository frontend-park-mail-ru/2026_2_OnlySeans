import './view-toggle.css';
import templateSource from './ViewToggle.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { Icon } from '../../core/icons.js';

const template = await loadAssets({ template: templateSource });

const OPTIONS = [
  { value: 'grid', label: 'Сетка', icon: Icon.GRID },
  { value: 'list', label: 'Список', icon: Icon.LIST },
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
