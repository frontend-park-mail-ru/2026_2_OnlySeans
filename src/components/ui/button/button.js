import { BaseComponent } from '../base-component.js';
import Handlebars from 'handlebars';

const buttonTemplate = Handlebars.compile(`
  <button class="button {{#if variant}}button--{{variant}}{{/if}}" type="{{type}}">{{text}}</button>
`);

export class Button extends BaseComponent {
  constructor({ text, type = 'button', variant = '' }) {
    super(buttonTemplate, { text, type, variant });
  }
}

export const createButton = (props) => new Button(props).render();
