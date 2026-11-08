import { Component } from '../../core/component.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { MovieGrid } from '../../components/movie-grid/MovieGrid.js';
import { loadTemplate } from '../../core/assets.js';

const template = await loadTemplate(new URL('./ProfileShelf.hbs', import.meta.url));

const PREVIEW = 6;

export class ProfileShelf extends Component {
  static template = template;

  onRender() {
    const { title, href, films } = this.props;
    this.insert(
      'heading',
      new SectionHeading({
        title,
        count: String(films.length),
        link: { href, text: 'Весь список' },
      }),
    );
    this.insert(
      'content',
      films.length
        ? new MovieGrid({ films: films.slice(0, PREVIEW), view: 'grid' })
        : new StatusMessage({ text: 'Пока пусто. Добавляйте фильмы кнопками на карточках.' }),
    );
  }
}
