import { BaseComponent } from '../base-component.js';

const buttonTemplate = window.Handlebars.compile(`
  <button type="{{type}}">{{text}}</button>
`);

export class Button extends BaseComponent {
  constructor({ text, type = 'button' }) {
    super(buttonTemplate, { text, type });
  }
}

export const createButton = (props) => new Button(props).render();