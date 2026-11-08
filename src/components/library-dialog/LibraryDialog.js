import { Modal } from '../modal/Modal.js';
import { countLabel } from '../../core/format.js';
import {
  createCollection,
  readLibrary,
  setInCollection,
  setSaved,
} from '../../services/library.js';
import { notify } from '../../services/notice.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./library-dialog.css', import.meta.url));
const template = await loadTemplate(new URL('./LibraryDialog.hbs', import.meta.url));

const FILM_FORMS = ['фильм', 'фильма', 'фильмов'];

export class LibraryDialog extends Modal {
  static template = template;

  context() {
    const { film } = this.props;
    const library = readLibrary();
    return {
      film,
      watched: library.watched.includes(film.id),
      collections: library.collections.map((item) => ({
        id: item.id,
        name: item.name,
        included: item.filmIds.includes(film.id),
        count: countLabel(item.filmIds.length, FILM_FORMS),
      })),
    };
  }

  onRender() {
    const filmId = this.props.film.id;
    this.delegate('click', '.modal__close', () => this.close());
    this.delegate('click', '.library-dialog__link', () => this.close());
    this.delegate('change', '[name="watched"]', (event, input) =>
      this.#save(() => setSaved('watched', filmId, input.checked)),
    );
    this.delegate('change', '[name="collection"]', (event, input) =>
      this.#save(() => setInCollection(input.value, filmId, input.checked)),
    );
    this.delegate('submit', '.library-dialog__form', (event, form) => {
      event.preventDefault();
      this.#save(() => createCollection(form.elements.name.value, filmId), true);
    });
  }

  #save(change, rerender = false) {
    try {
      change();
      if (rerender) this.refreshContent();
    } catch (error) {
      notify(error.message, { type: 'error' });
      this.refreshContent();
    }
  }
}
