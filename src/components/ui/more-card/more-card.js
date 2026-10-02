import { BaseComponent } from '../base-component.js';

const template = window.Handlebars.compile(`
  <a class="movie-card movie-card--more" href="{{href}}" data-link aria-label="Больше: {{title}}">
    <span class="more-card__icon" aria-hidden="true">→</span>
    <span class="more-card__title">Больше</span>
    <span class="more-card__description">Вся подборка<br>{{title}}</span>
  </a>
`);
export class MoreCard extends BaseComponent {
  constructor(props) { super(template, props); }
}
export const createMoreCard = (props) => new MoreCard(props).render();
