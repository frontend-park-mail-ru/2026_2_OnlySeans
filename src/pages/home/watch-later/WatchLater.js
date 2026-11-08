import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { readLibrary, watchLibrary } from '../../../services/library.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';
import { MovieCard } from '../../../components/movie-card/MovieCard.js';
import { loadStyles, loadTemplate } from '../../../core/assets.js';

loadStyles(new URL('./watch-later.css', import.meta.url));
const template = await loadTemplate(new URL('./WatchLater.hbs', import.meta.url));

export class WatchLater extends Component {
  static template = template;

  context() {
    const byId = new Map(this.props.films.map((film) => [film.id, film]));
    this.saved = readLibrary()
      .watchlater.map((id) => byId.get(id))
      .filter(Boolean);
    return { films: this.saved };
  }

  onRender() {
    const count = this.saved.length
      ? countLabel(this.saved.length, ['фильм', 'фильма', 'фильмов'])
      : '';
    this.insert('heading', new SectionHeading({ title: 'Смотреть позже', count }));
    const row = this.find('.watch-later__row');
    this.saved.forEach((film) => this.insert(row, new MovieCard({ film })));
    this.watch(watchLibrary(() => this.update()));
  }
}
