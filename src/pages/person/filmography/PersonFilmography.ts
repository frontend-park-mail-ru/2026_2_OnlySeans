import './person-filmography.css';
import templateSource from './PersonFilmography.hbs';
import { Component } from '../../../core/component.js';
import { loadAssets } from '../../../core/assets.js';
import { personRoles, sortPersonCredits } from '../../../services/person-profile.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';

const template = await loadAssets({ template: templateSource });
const chevron = new URL('../../../assets/icons/person-chevron.svg', import.meta.url).href;
const PAGE_SIZE = 40;
const SORTS = ['newest', 'oldest', 'title'];

export class PersonFilmography extends Component {
  static template = template;
  #role = this.props.query?.get('role') || '';
  #sort = SORTS.includes(this.props.query?.get('sort')) ? this.props.query.get('sort') : 'newest';
  #limit = PAGE_SIZE;

  context() {
    const groups = personRoles(this.props.credits);
    const current = groups.find((group) => group.role === this.#role) || groups[0];
    this.#role = current?.role || '';
    let previousDecade = '';
    const all = sortPersonCredits(current?.credits || [], this.#sort);
    const rows = all.slice(0, this.#limit).map((credit) => {
      const year = credit.film.year > 0 ? String(credit.film.year) : '—';
      const decade =
        credit.film.year > 0 ? `${Math.floor(credit.film.year / 10) * 10}-е` : 'Год не указан';
      const heading = this.#sort !== 'title' && decade !== previousDecade ? decade : '';
      previousDecade = decade;
      return {
        ...credit,
        year,
        decade: heading,
        caption: credit.character || current.label,
        chevron,
      };
    });
    return {
      unavailable: this.props.unavailable,
      groups: groups.map((group) => ({ ...group, active: group.role === this.#role })),
      rows,
      empty: !all.length,
      hasMore: all.length > this.#limit,
    };
  }

  onRender() {
    this.insert('heading', new SectionHeading({ title: 'Фильмография' }));
    if (this.props.unavailable) return;
    const rows = this.context().rows;
    this.findAll('[data-film-actions]').forEach((slot, index) => {
      this.insert(slot, new MovieActions({ film: rows[index].film }));
    });
    const sort = this.find<HTMLSelectElement>('[data-person-sort]');
    sort.value = this.#sort;
    this.on(
      'change',
      () => {
        this.#sort = sort.value;
        this.#limit = PAGE_SIZE;
        this.#remember();
        this.update();
        this.find('[data-person-sort]')?.focus({ preventScroll: true });
      },
      sort,
    );
    this.delegate('click', '[data-person-role]', (event, button) => {
      this.#role = button.dataset.personRole;
      this.#limit = PAGE_SIZE;
      this.#remember();
      this.update();
      this.findAll('[data-person-role]')
        .find((item) => item.dataset.personRole === this.#role)
        ?.focus({ preventScroll: true });
    });
    this.delegate('click', '[data-person-more]', () => {
      const firstNew = this.#limit;
      this.#limit += PAGE_SIZE;
      this.update();
      const target =
        this.find('[data-person-more]') || this.findAll('.person-filmography__title')[firstNew];
      target?.focus({ preventScroll: true });
    });
  }

  #remember() {
    const url = new URL(location.href);
    if (this.#role) url.searchParams.set('role', this.#role);
    if (this.#sort === 'newest') url.searchParams.delete('sort');
    else url.searchParams.set('sort', this.#sort);
    history.replaceState(history.state, '', url);
  }
}
