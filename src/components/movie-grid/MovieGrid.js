import { Component } from '../../core/component.js';
import { MovieCard } from '../movie-card/MovieCard.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./movie-grid.css', import.meta.url));
const template = await loadTemplate(new URL('./MovieGrid.hbs', import.meta.url));

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
