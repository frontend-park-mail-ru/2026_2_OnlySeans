import templateSource from './AdvancedSearchFilters.hbs';
import { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import { store } from '../../core/store.js';
import { readLibrary } from '../../services/library.js';
import { readShelves, shelfFilmIds } from '../../services/shelves.js';
import { loginPathHere } from '../../services/auth-return.js';
import type { SearchLibraryFilters, ListFilter } from '../../services/search.js';

const template = await loadAssets({ template: templateSource });
interface AdvancedProps {
  state: SearchLibraryFilters;
  rated: ListFilter;
  ratedCount: number | null;
  shelf: string;
  onApply(state: SearchLibraryFilters, rated: ListFilter, shelf: string): void;
}

/** Фильтры по личным спискам не требуют дополнительных запросов каталога. */
export class AdvancedSearchFilters extends Modal {
  static template = template;
  declare props: AdvancedProps;

  constructor(props: AdvancedProps) {
    super(props);
  }

  context() {
    const library = readLibrary();
    return {
      user: store.get('user'),
      loginHref: loginPathHere(),
      shelves: readShelves().map((shelf) => ({
        ...shelf,
        count: shelfFilmIds(shelf, library.favorite).length,
      })),
      rows: [
        { key: 'watched', label: 'Просмотренное', icon: 'eye' },
        { key: 'watchlater', label: 'Смотреть позже', icon: 'clock' },
        { key: 'favorite', label: 'Избранное', icon: 'heart' },
      ]
        .map((row) => ({ ...row, count: library[row.key as keyof typeof library].length }))
        .concat([
          {
            key: 'rated',
            label: 'С моей оценкой',
            icon: 'rating-star',
            count: this.props.ratedCount ?? -1,
          },
        ]),
    };
  }

  onRender() {
    const user = store.get('user');
    this.findAll<HTMLInputElement>('input').forEach((input) => {
      input.checked =
        (input.name === 'rated'
          ? this.props.rated
          : this.props.state[input.name as keyof SearchLibraryFilters]) === input.value;
      input.disabled = !user;
    });
    this.find<HTMLButtonElement>('[data-apply]').disabled = !user;
    const shelf = this.find<HTMLSelectElement>('[name=shelf]');
    shelf.value = readShelves().some((item) => item.id === this.props.shelf)
      ? this.props.shelf
      : '';
    shelf.disabled = !user;
    this.delegate('click', '[data-close]', () => this.close());
    this.delegate('click', '[data-reset]', () => {
      shelf.value = '';
      this.findAll<HTMLInputElement>('input').forEach((input) => {
        input.checked = input.value === 'all';
      });
    });
    this.on('submit', (event) => {
      event.preventDefault();
      if (!store.get('user')) return;
      const state: SearchLibraryFilters = { watched: 'all', watchlater: 'all', favorite: 'all' };
      let rated: ListFilter = 'all';
      this.findAll<HTMLInputElement>('input:checked').forEach((input) => {
        if (input.name === 'rated') rated = input.value as ListFilter;
        else state[input.name as keyof SearchLibraryFilters] = input.value as ListFilter;
      });
      this.close();
      this.props.onApply(state, rated, shelf.value);
    });
  }
}
