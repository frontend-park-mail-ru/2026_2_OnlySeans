import templateSource from './ShelfPicker.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import { readShelves, setFilmShelves } from '../../services/shelves.js';
import { ShelfEditor } from './ShelfEditor.js';
import { isSaved } from '../../services/library.js';

const template = await loadAssets({ template: templateSource });

export class ShelfPicker extends Modal {
  static template = template;
  #selected: Set<string>;
  #editor: ShelfEditor | null = null;
  constructor(props: { filmId: number; title: string }) {
    super(props);
    this.#selected = new Set(
      readShelves()
        .filter((shelf) => shelf.filmIds.includes(props.filmId))
        .map((shelf) => shelf.id),
    );
  }
  context() {
    return { title: this.props.title, shelves: readShelves() };
  }

  onRender() {
    this.#sync();
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('change', '[data-shelf]', (_, control) => {
      const input = control as HTMLInputElement;
      if (input.checked) this.#selected.add(input.value);
      else this.#selected.delete(input.value);
    });
    this.delegate('click', '[data-create]', () => {
      this.#editor = new ShelfEditor({
        onSaved: (shelf) => {
          if (shelf) this.#selected.add(shelf.id);
          if (!this.destroyed) {
            this.refreshContent();
            this.#sync();
          }
        },
      }).open();
    });
    this.on('submit', (event) => {
      event.preventDefault();
      if (!isSaved('favorite', this.props.filmId)) {
        this.find('[data-error]').textContent = 'Этот фильм больше не находится в избранном';
        return;
      }
      try {
        setFilmShelves(this.props.filmId, [...this.#selected]);
        this.close();
      } catch (error) {
        this.find('[data-error]').textContent =
          error instanceof Error ? error.message : 'Не удалось сохранить полки';
      }
    });
  }
  #sync() {
    this.findAll<HTMLInputElement>('[data-shelf]').forEach((input) => {
      input.checked = this.#selected.has(input.value);
    });
  }
  destroy() {
    this.#editor?.close();
    super.destroy();
  }
}
