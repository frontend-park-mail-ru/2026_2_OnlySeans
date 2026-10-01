import { BaseComponent } from '../base-component.js';

const errorBoxTemplate = window.Handlebars.compile(`
  <div class="error-box" id="{{id}}"></div>
`);

export class ErrorBox extends BaseComponent {
  constructor(id) {
    super(errorBoxTemplate, { id });
  }
}

export const createErrorBox = (id) => new ErrorBox(id).render();