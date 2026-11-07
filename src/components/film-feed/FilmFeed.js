import { Component } from '../../core/component.js';
import { readJson, writeJson } from '../../services/storage.js';
import { arrive } from '../../services/page-transition.js';
import { SectionHeading } from '../section-heading/SectionHeading.js';
import { StatusMessage } from '../status-message/StatusMessage.js';
import { MovieGrid } from '../movie-grid/MovieGrid.js';
import { ViewToggle } from '../view-toggle/ViewToggle.js';
import { Pagination, currentPageNumber } from '../pagination/Pagination.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./film-feed.css', import.meta.url));
const template = await loadTemplate(new URL('./FilmFeed.hbs', import.meta.url));

const PAGE_SIZE = 42;
const VIEW_KEY = 'frame:catalog-view';

export class FilmFeed extends Component {
  static template = template;

  context() {
    return { ...this.props, empty: !this.props.films.length };
  }

  onRender() {
    const { films, query, title, level, count, empty, anchor } = this.props;
    const view = readJson(VIEW_KEY, 'grid') === 'list' ? 'list' : 'grid';
    const tools = films.length
      ? new ViewToggle({ view, onChange: (next) => this.#setView(next) })
      : null;
    this.insert('heading', new SectionHeading({ title, level, count, tools }));
    if (!films.length) {
      this.insert('empty', new StatusMessage({ text: empty }));
      return;
    }
    const total = Math.ceil(films.length / PAGE_SIZE);
    const current = Math.min(currentPageNumber(query), total);
    const start = (current - 1) * PAGE_SIZE;
    this.grid = this.insert(
      'grid',
      new MovieGrid({ films: films.slice(start, start + PAGE_SIZE), view }),
    );
    if (total > 1)
      this.insert(
        'pagination',
        new Pagination({ current, total, anchor, label: `Страницы: ${title}` }),
      );
    else this.find('[data-slot="pagination"]').remove();

    if (anchor && location.hash === `#${anchor}`)
      requestAnimationFrame(() => this.element?.scrollIntoView({ block: 'start' }));
  }

  #setView(view) {
    writeJson(VIEW_KEY, view);
    this.grid.setView(view);
    arrive(this.grid.element, { duration: 280 });
  }
}
