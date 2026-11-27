import './person-card.css';
import templateSource from './PersonCard.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

/** Карточка персоны с переходом к биографии и фильмографии. */
export class PersonCard extends Component {
  static template = template;
}
