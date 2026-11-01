import { BaseComponent } from '../base-component.js';
import Handlebars from 'handlebars';

const switchLinkTemplate = Handlebars.compile(`
  <div class="switch-link">{{text}} <a href="{{href}}" data-link>{{linkText}}</a></div>
`);

export class SwitchLink extends BaseComponent {
  constructor(props) {
    super(switchLinkTemplate, props);
  }
}

export const createSwitchLink = (props) => new SwitchLink(props).render();