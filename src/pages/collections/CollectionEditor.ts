import templateSource from './CollectionEditor.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import {
  saveLocalCollection,
  collectionError,
  type LocalCollection,
} from '../../services/collections.js';
import type { Film } from '../../api/films.js';
import { normalizeSearch } from '../../services/search.js';
const template = await loadAssets({ template: templateSource });
export class CollectionEditor extends Modal {
  static template = template;
  constructor(props: { films: Film[]; collection?: LocalCollection; onSaved(id: string): void }) {
    super(props);
  }
  context() {
    return { films: this.props.films, collection: this.props.collection };
  }
  onRender() {
    const title = this.find<HTMLInputElement>('[name=title]');
    const description = this.find<HTMLTextAreaElement>('[name=description]');
    const error = this.find('[data-error]');
    const selected = new Set<number>(this.props.collection?.filmIds ?? []);
    this.findAll<HTMLInputElement>('[data-film]').forEach((input) => {
      input.checked = selected.has(Number(input.value));
    });
    const count = () => {
      this.find('[data-count]').textContent = selected.size + ' / 100';
    };
    count();
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('input', '[name=search]', (_, input) => {
      const needle = normalizeSearch((input as HTMLInputElement).value);
      this.findAll<HTMLElement>('[data-choice]').forEach((label) => {
        label.hidden = !normalizeSearch(label.textContent || '').includes(needle);
      });
    });
    this.delegate('change', '[data-film]', (_, control) => {
      const input = control as HTMLInputElement;
      if (input.checked && selected.size >= 100) {
        input.checked = false;
        error.textContent = 'Можно выбрать до 100 фильмов';
        return;
      }
      if (input.checked) selected.add(Number(input.value));
      else selected.delete(Number(input.value));
      error.textContent = '';
      count();
    });
    this.on('submit', (event) => {
      event.preventDefault();
      const problem = collectionError(title.value, description.value, [...selected]);
      error.textContent = problem;
      title.setAttribute(
        'aria-invalid',
        String(!title.value.trim() || [...title.value.trim()].length > 80),
      );
      if (problem) return;
      try {
        const saved = saveLocalCollection(
          title.value,
          description.value,
          [...selected],
          this.props.collection?.id,
        );
        this.close();
        this.props.onSaved(saved.id);
      } catch (failure) {
        error.textContent = failure.message;
      }
    });
  }
}
