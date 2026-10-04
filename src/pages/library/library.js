import { BaseComponent } from '../../components/ui/base-component.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { createFilmGrid } from '../../components/ui/film-tile/film-tile.js';
import { createFilmRows } from '../../components/ui/film-row/film-row.js';
import { getMovies } from '../../api/movies.js';
import { LISTS, pickFromList } from '../../services/library.js';

const template = window.Handlebars.compile(`
  <div class="library">
    <h1 class="page-title">{{title}}</h1>
    <p class="page-subtitle"></p>
    <p class="page-status" role="status">Загружаем список…</p>
    <div class="library__list"></div>
  </div>
`);

class LibraryPage extends BaseComponent {
  constructor({ navigate }, { list, title, emptyText }) {
    super(template, { title });
    this.navigate = navigate;
    this.list = list;
    this.title = title;
    this.emptyText = emptyText;
  }

  render() {
    document.title = `${this.title} — Frame`;

    const content = this.create();
    loadData(content, getMovies(), (movies) => {
      this.movies = movies;
      this.show(content);
    });

    return createPageShell({ navigate: this.navigate, content });
  }

  show(content) {
    const movies = pickFromList(this.list, this.movies);

    content.querySelector('.page-subtitle').textContent = `${movies.length} в списке`;
    content.querySelector('.page-status').textContent = movies.length ? '' : this.emptyText;
    content.querySelector('.library__list').replaceChildren(this.createList(movies, content));
  }
}

export class FavoritesPage extends LibraryPage {
  constructor(props) {
    super(props, {
      list: LISTS.FAVORITES,
      title: 'Избранное',
      emptyText: 'Здесь появятся фильмы, которые вы добавите в избранное.',
    });
  }

  createList(movies) {
    return createFilmGrid(movies);
  }
}

export class WatchlistPage extends LibraryPage {
  constructor(props) {
    super(props, {
      list: LISTS.WATCHLIST,
      title: 'Буду смотреть',
      emptyText: 'Здесь появятся фильмы, которые вы отложите на потом.',
    });
  }

  createList(movies, content) {
    return createFilmRows(movies, { onChange: () => this.show(content) });
  }
}
