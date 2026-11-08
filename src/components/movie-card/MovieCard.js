import { Component } from '../../core/component.js';
import { MovieActions } from '../movie-actions/MovieActions.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./movie-card.css', import.meta.url));
const template = await loadTemplate(new URL('./MovieCard.hbs', import.meta.url));

export class MovieCard extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'card' }));
  }
}
