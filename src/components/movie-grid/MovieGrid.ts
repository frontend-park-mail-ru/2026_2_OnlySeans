import './movie-grid.css';
import templateSource from './MovieGrid.hbs';
import { Component } from '../../core/component.js';
import { MovieCard } from '../movie-card/MovieCard.js';
import { loadAssets } from '../../core/assets.js';
import type { Film } from '../../api/films.js';
import type { CatalogRatings } from '../../services/catalog-filters.js';

const template = await loadAssets({ template: templateSource });

export class MovieGrid extends Component {
  static template = template;
  #cards = new Map<number, MovieCard>();
  #ratings: CatalogRatings = new Map();

  onRender() {
    this.#cards.clear();
    this.#ratings = this.props.ratings || new Map();
    this.appendFilms(this.props.films);
  }

  appendFilms(films: Film[]) {
    films.forEach((film) => {
      const card = this.insert(
        this.element,
        new MovieCard({ film, rating: this.#ratings.get(film.id) }),
      );
      if (this.props.ranked)
        card.element.dataset.rank = String((this.props.rankOffset || 0) + this.#cards.size + 1);
      this.#cards.set(film.id, card);
    });
  }

  setRatings(ratings: CatalogRatings) {
    this.#ratings = ratings;
    this.#cards.forEach((card, id) => card.setRating(ratings.get(id)));
  }

  setView(view: string) {
    this.props.view = view;
    this.element.dataset.view = view;
  }
}
