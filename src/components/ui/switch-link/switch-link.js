import { BaseComponent } from '../base-component.js';

const switchLinkTemplate = window.Handlebars.compile(`
  <div class="switch-link">{{text}} <a href="{{href}}" data-link>{{linkText}}</a></div>
`);

export class SwitchLink extends BaseComponent {
  constructor(props) {
    super(switchLinkTemplate, props);
  }
}

export const createSwitchLink = (props) => new SwitchLink(props).render();