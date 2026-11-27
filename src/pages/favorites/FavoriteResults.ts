import templateSource from './FavoriteResults.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { MovieActions } from '../../components/movie-actions/MovieActions.js';
import type { Film } from '../../api/films.js';
import { FavoriteCard } from './FavoriteCard.js';

const template = await loadAssets({ template: templateSource });
interface ResultProps {
  films: Film[];
  scores: Map<number, number>;
  scoresKnown: boolean;
  view: string;
  shared: boolean;
  onShelves(film: Film): void;
  onRate(film: Film): void;
}

/** Собственные оценки отделены от публичного рейтинга, неизвестные даты не подставляются. */
export class FavoriteResults extends Component<ResultProps> {
  static template = template;
  #visible = 40;
  context() {
    return {
      ...this.props,
      table: this.props.view === 'list',
      rows: this.props.films
        .slice(0, this.#visible)
        .map((film) => ({ film, score: this.props.scores.get(film.id) ?? null })),
      more: this.props.films.length > this.#visible,
      empty: !this.props.films.length,
    };
  }
  onRender() {
    this.delegate('click', '[data-rate]', (_, button) => {
      const film = this.props.films.find((film) => film.id === Number(button.dataset.rate));
      if (film) this.props.onRate(film);
    });
    const films = this.props.films.slice(0, this.#visible);
    if (this.props.view === 'list')
      films.forEach((film) =>
        this.insert(
          this.find(`[data-actions="${film.id}"]`),
          new MovieActions({ film, variant: 'card' }),
        ),
      );
    else {
      const grid = this.query('[data-grid]');
      if (grid)
        films.forEach((film) =>
          this.insert(
            grid,
            new FavoriteCard({
              film,
              score: this.props.scores.get(film.id) ?? null,
              shared: this.props.shared,
              onShelves: this.props.onShelves,
            }),
          ),
        );
    }
    this.delegate('click', '[data-more]', () => {
      this.#visible += 40;
      this.update();
    });
    this.delegate('click', '[data-shelf-picker]', (_, button) => {
      const film = films.find((film) => film.id === Number(button.dataset.shelfPicker));
      if (film) this.props.onShelves(film);
    });
  }
}
