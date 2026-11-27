import './film-people.css';
import templateSource from './FilmPeople.hbs';
import { Component } from '../../../core/component.js';
import { ROLE_LABELS } from '../../../api/people.js';
import { getFilmPeople } from '../../../api/people.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const ROLE_ORDER = ['director', 'creator', 'actor', 'voice', 'writer', 'producer'];

export class FilmPeople extends Component {
  static template = template;
  #busy = false;

  context() {
    const people = [...this.props.people]
      .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
      .map((item) => ({
        ...item,
        caption: item.character || ROLE_LABELS[item.role] || '',
      }));
    return { people, failed: this.props.failed, busy: this.#busy, empty: !people.length };
  }

  onRender() {
    const button = this.query<HTMLButtonElement>('[data-people-retry]');
    if (button) button.disabled = this.#busy;
    this.delegate('click', '[data-people-retry]', () => this.#retry());
  }

  async #retry() {
    if (this.#busy) return;
    this.#busy = true;
    this.update();
    try {
      const people = await getFilmPeople(this.props.filmId);
      this.props = { ...this.props, people, failed: false };
    } catch {
      this.props = { ...this.props, failed: true };
    } finally {
      this.#busy = false;
      if (!this.destroyed) this.update();
    }
  }
}
