import './movie-grid.css';
import templateSource from './MovieGrid.hbs';
import { Component } from '../../core/component.js';
import { MovieCard } from '../movie-card/MovieCard.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class MovieGrid extends Component {
  static template = template;

  onRender() {
    this.props.films.forEach((film) => this.insert(this.element, new MovieCard({ film })));
  }

  setView(view) {
    this.props.view = view;
    this.element.dataset.view = view;
  }
}
