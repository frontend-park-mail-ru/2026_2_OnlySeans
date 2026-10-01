import { BaseComponent } from '../base-component.js';

const cardTemplate = window.Handlebars.compile(`
  <div class="auth-card">
    <h1>{{title}}</h1>
  </div>
`);

export class Card extends BaseComponent {
  constructor(props) {
    super(cardTemplate, props);
  }
}

export const createCard = (props) => new Card(props).render();