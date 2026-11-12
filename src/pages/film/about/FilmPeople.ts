import './film-people.css';
import templateSource from './FilmPeople.hbs';
import { Component } from '../../../core/component.js';
import { ROLE_LABELS } from '../../../api/people.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const ROLE_ORDER = ['director', 'creator', 'actor', 'voice', 'writer', 'producer'];

export class FilmPeople extends Component {
  static template = template;

  context() {
    const people = [...this.props.people]
      .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
      .map((item) => ({
        ...item,
        caption: item.character || ROLE_LABELS[item.role] || '',
      }));
    return { people };
  }
}
