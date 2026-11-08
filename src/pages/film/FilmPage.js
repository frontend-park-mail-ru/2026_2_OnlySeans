import { Component } from '../../core/component.js';
import { getFilm } from '../../api/films.js';
import { loadCatalog } from '../../services/catalog.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { FilmHero } from './film-hero/FilmHero.js';
import { FilmAbout } from './about/FilmAbout.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./film-page.css', import.meta.url));
const template = await loadTemplate(new URL('./FilmPage.hbs', import.meta.url));

export class FilmPage extends Component {
  static template = template;

  #request = null;

  prepare() {
    this.#request = getFilm(this.props.params.id);

    return Promise.allSettled([this.#request, loadCatalog()]);
  }

  onRender() {
    document.title = 'Фильм | Frame';
    this.#load();
  }

  #load() {
    loadInto(this, 'hero', {
      loading: 'Загружаем фильм...',

      load: () => {
        const request = this.#request ?? getFilm(this.props.params.id);
        this.#request = null;
        return request;
      },
      render: (film) => {
        document.title = `${film.title} | Frame`;
        this.insert('about', new FilmAbout({ film }));
        return new FilmHero({ film });
      },
      failure: (error) =>
        error.status === 404
          ? { text: 'Такого фильма нет в каталоге.', retry: false }
          : 'Не удалось загрузить фильм.',
    });
  }
}
