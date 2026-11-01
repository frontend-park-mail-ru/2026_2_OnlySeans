import { BaseComponent } from '../base-component.js';
import Handlebars from 'handlebars';

const cardTemplate = Handlebars.compile(`
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