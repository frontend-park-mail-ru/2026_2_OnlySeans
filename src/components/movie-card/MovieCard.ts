import './movie-card.css';
import templateSource from './MovieCard.hbs';
import { Component } from '../../core/component.js';
import { MovieActions } from '../movie-actions/MovieActions.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class MovieCard extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'card' }));
  }
}
