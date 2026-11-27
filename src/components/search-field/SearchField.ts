import './search-field.css';
import templateSource from './SearchField.hbs';
import suggestionsSource from './SearchSuggestions.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { rememberSearch, searchHistory } from '../../services/search-history.js';
import { loadSearchData, matchesFilm, matchesPerson } from '../../services/search.js';

const template = await loadAssets({ template: templateSource });
const suggestions = await loadAssets({ template: suggestionsSource });
let nextId = 0;

/** Подсказки отменяют устаревшие запросы и поддерживают клавиатурный выбор. */
export class SearchField extends Component {
  static template = template;
  #id = `search-${++nextId}`;
  #controller: AbortController | null = null;
  #timer = 0;
  #active = -1;

  context() {
    return {
      query: new URLSearchParams(location.search).get('q') || '',
      popupId: `${this.#id}-suggestions`,
    };
  }

  onRender() {
    const input = this.find<HTMLInputElement>('input');
    this.find('[data-search-clear]').hidden = !input.value;
    this.on('submit', (event) => {
      event.preventDefault();
      const selected = this.query<HTMLAnchorElement>(`[data-option="${this.#active}"]`);
      if (selected && !this.find('[data-suggestions]').hidden) {
        this.#navigate(selected.getAttribute('href')!);
        return;
      }
      const query = input.value.trim();
      this.#navigate(`/search${query ? `?${new URLSearchParams({ q: query })}` : ''}`);
    });
    this.on(
      'input',
      () => {
        this.find('[data-search-clear]').hidden = !input.value;
        this.#schedule();
      },
      input,
    );
    this.on('focus', () => this.#schedule(0), input);
    this.delegate('click', '[data-search-clear]', () => {
      input.value = '';
      this.find('[data-search-clear]').hidden = true;
      input.focus();
      this.#schedule(0);
    });
    this.delegate('click', '[data-option]', (event, option) => {
      event.preventDefault();
      this.#navigate(option.getAttribute('href')!);
    });
    this.on(
      'pointerdown',
      (event) => {
        if (event.target instanceof Node && !this.element.contains(event.target)) this.#close();
      },
      document,
    );
    this.on('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !this.element.contains(event.relatedTarget))
        this.#close();
    });
    this.on(
      'keydown',
      (event) => {
        if (event.isComposing) return;
        if (event.key === 'Escape' && !this.find('[data-suggestions]').hidden) {
          event.preventDefault();
          event.stopPropagation();
          this.#close();
          return;
        }
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        const options = this.findAll<HTMLAnchorElement>('[data-option]');
        if (this.find('[data-suggestions]').hidden) {
          this.#schedule(0);
          return;
        }
        if (!options.length) return;
        this.#active =
          this.#active < 0
            ? event.key === 'ArrowDown'
              ? 0
              : options.length - 1
            : (this.#active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
              options.length;
        options.forEach((option, index) =>
          option.setAttribute('aria-selected', String(index === this.#active)),
        );
        input.setAttribute('aria-activedescendant', options[this.#active].id);
        options[this.#active].scrollIntoView({ block: 'nearest' });
      },
      input,
    );
    this.watch(() => {
      clearTimeout(this.#timer);
      this.#controller?.abort();
    });
  }

  #navigate(href: string) {
    rememberSearch(this.find<HTMLInputElement>('input').value.trim());
    this.#close();
    this.props.navigate(href);
  }

  #schedule(delay = 180) {
    clearTimeout(this.#timer);
    this.#controller?.abort();
    const query = this.find<HTMLInputElement>('input').value.trim();
    this.#show({
      query,
      loading: Boolean(query),
      history: searchHistory().map((text, index) => ({
        text,
        index,
        optionId: `${this.#id}-${index}`,
      })),
    });
    if (!query) return;
    this.#timer = window.setTimeout(() => {
      void this.#load(query);
    }, delay);
  }

  async #load(query: string) {
    const controller = new AbortController();
    this.#controller = controller;
    try {
      const data = await loadSearchData({ signal: controller.signal });
      if (controller.signal.aborted || this.destroyed) return;
      const films = data.films.filter((film) => matchesFilm(film, query));
      const people = data.people.filter((person) => matchesPerson(person, query));
      const preview = films.slice(0, 2);
      const peoplePreview = people.slice(0, 2);
      this.#show({
        query,
        failed: data.filmError || data.peopleError,
        total: films.length + people.length,
        empty: !films.length && !people.length && !data.filmError && !data.peopleError,
        films: preview.map((film, index) => ({ ...film, index, optionId: `${this.#id}-${index}` })),
        people: peoplePreview.map((person, index) => ({
          ...person,
          index: index + preview.length,
          optionId: `${this.#id}-${index + preview.length}`,
        })),
        allIndex: preview.length + peoplePreview.length,
      });
    } catch {
      if (!controller.signal.aborted && !this.destroyed) this.#show({ query, failed: true });
    }
  }

  #show(value: {
    query: string;
    loading?: boolean;
    failed?: boolean;
    empty?: boolean;
    total?: number;
    films?: object[];
    people?: object[];
    history?: object[];
    allIndex?: number;
  }) {
    this.#active = -1;
    const input = this.find<HTMLInputElement>('input');
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', 'true');
    const host = this.find('[data-suggestions]');
    host.hidden = false;
    host.innerHTML = suggestions({
      ...value,
      popupId: `${this.#id}-suggestions`,
      allId: `${this.#id}-${value.allIndex ?? 0}`,
      allIndex: value.allIndex ?? 0,
      allHref: `/search?${new URLSearchParams({ q: value.query })}`,
    });
  }

  #close() {
    clearTimeout(this.#timer);
    this.#controller?.abort();
    this.#active = -1;
    this.find('[data-suggestions]').hidden = true;
    const input = this.find<HTMLInputElement>('input');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  focus() {
    this.find<HTMLInputElement>('input').focus();
  }

  syncRoute() {
    this.#close();
    const input = this.find<HTMLInputElement>('input');
    input.value = new URLSearchParams(location.search).get('q') || '';
    this.find('[data-search-clear]').hidden = !input.value;
  }
}
