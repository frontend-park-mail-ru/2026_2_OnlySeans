import './watch-later-list.css';
import templateSource from './WatchLaterList.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { countLabel } from '../../core/format.js';
import { MovieGrid } from '../../components/movie-grid/MovieGrid.js';
import { MovieActions } from '../../components/movie-actions/MovieActions.js';
import { ViewToggle } from '../../components/view-toggle/ViewToggle.js';
import { loadCatalogRatings } from '../../services/catalog-ratings.js';
import type { CatalogRatings } from '../../services/catalog-filters.js';
import { readContentPreferences } from '../../services/content-preferences.js';
import { readJson, writeJson, StorageKey } from '../../services/storage.js';
import type { Film } from '../../api/films.js';
import { moveToWatched } from '../../services/library.js';
import { notify } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });
const star = new URL('../../assets/images/library/star.svg', import.meta.url).href;
const more = new URL('../../assets/images/library/more.svg', import.meta.url).href;
type Filter = 'all' | 'movie' | 'series';
type Sort = 'catalog' | 'title' | 'year' | 'rating';

/** Личный список с общими карточками, фильтрами в URL и действиями каждой строки. */
export class WatchLaterList extends Component<{ films: Film[]; query: URLSearchParams }> {
  static template = template;
  #filter: Filter = 'all';
  #sort: Sort = 'catalog';
  #view: string;
  #ratings: CatalogRatings = new Map();
  #ratingStatus: 'loading' | 'ready' | 'error' = 'loading';

  constructor(props: { films: Film[]; query: URLSearchParams }) {
    super(props);
    const type = props.query.get('type');
    if (type === 'movie' || type === 'series') this.#filter = type;
    const sort = props.query.get('sort');
    if (sort === 'title' || sort === 'year' || sort === 'rating') this.#sort = sort;
    this.#view =
      props.query.get('view') ||
      readJson(StorageKey.CATALOG_VIEW, matchMedia('(max-width: 767px)').matches ? 'list' : 'grid');
    if (this.#view !== 'list') this.#view = 'grid';
  }

  #films() {
    const films = this.props.films.filter(
      (film) => this.#filter === 'all' || film.type === this.#filter,
    );
    if (this.#sort === 'title') films.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    if (this.#sort === 'year') films.sort((a, b) => b.year - a.year);
    if (this.#sort === 'rating')
      films.sort(
        (a, b) => (this.#ratings.get(b.id)?.average || 0) - (this.#ratings.get(a.id)?.average || 0),
      );
    return films;
  }

  context() {
    const films = this.#films();
    const { titles } = readContentPreferences();
    return {
      grid: this.#view === 'grid',
      empty: !films.length,
      count: countLabel(this.props.films.length, ['фильм', 'фильма', 'фильмов']),
      hours: this.props.films.every((film) => film.duration)
        ? Math.round(this.props.films.reduce((sum, film) => sum + (film.duration || 0), 0) / 60)
        : '',
      wheelHref:
        '/wheel?' +
        new URLSearchParams({
          pool: films
            .slice(0, 100)
            .map((film) => film.id)
            .join(','),
        }),
      filters: (
        [
          ['all', 'Всё'],
          ['movie', 'Фильмы'],
          ['series', 'Сериалы'],
        ] as const
      ).map(([value, label]) => ({
        value,
        label,
        active: this.#filter === value,
        count: this.props.films.filter((film) => value === 'all' || film.type === value).length,
      })),
      films: films.map((film) => ({
        ...film,
        star,
        more,
        title: titles === 'original' && film.originalTitle ? film.originalTitle : film.title,
        rating: this.#ratings.get(film.id)?.votes
          ? this.#ratings
              .get(film.id)!
              .average.toLocaleString('ru', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
          : '',
      })),
      ratingError: this.#ratingStatus === 'error',
      wheel: new URL('../../assets/images/library/wheel.svg', import.meta.url).href,
      chevron: new URL('../../assets/images/library/chevron.svg', import.meta.url).href,
    };
  }

  onRender() {
    const films = this.#films();
    this.insert(
      'view',
      new ViewToggle({
        view: this.#view,
        onChange: (view) => {
          this.#view = view;
          writeJson(StorageKey.CATALOG_VIEW, view);
          this.#refresh();
        },
      }),
    );
    if (this.#view === 'grid' && films.length)
      this.insert('grid', new MovieGrid({ films, view: 'grid', ratings: this.#ratings }));
    else
      this.findAll('[data-actions]').forEach((host) => {
        const film = films.find((item) => item.id === Number(host.dataset.actions));
        if (film) this.insert(host, new MovieActions({ film }));
      });
    this.find<HTMLSelectElement>('[name=sort]').value = this.#sort;
    this.delegate('click', '[data-type]', (_, button) => {
      this.#filter = button.dataset.type as Filter;
      this.#refresh();
      this.query(`[data-type="${this.#filter}"]`)?.focus({ preventScroll: true });
    });
    this.delegate('change', '[name=sort]', (_, input) => {
      this.#sort = (input as HTMLSelectElement).value as Sort;
      this.#refresh();
      this.find('[name=sort]').focus();
    });
    this.delegate('click', '[data-retry-ratings]', () => {
      this.#ratingStatus = 'loading';
      this.update();
    });
    this.delegate('click', '[data-move-watched]', async (_, button) => {
      const control = button as HTMLButtonElement;
      control.disabled = true;
      try {
        await moveToWatched(Number(control.dataset.moveWatched));
        notify('Фильм перенесён в просмотренное.', { type: 'success' });
      } catch (error) {
        notify(error.message, { type: 'error' });
      } finally {
        if (!this.destroyed) control.disabled = false;
      }
    });
    this.on('keydown', (event) => {
      if (event.key !== 'Escape') return;
      this.findAll<HTMLDetailsElement>('details[open]').forEach((menu) => {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      });
    });
    if (this.#ratingStatus !== 'loading') return;
    const controller = new AbortController();
    this.watch(() => controller.abort());
    void loadCatalogRatings(this.props.films, { signal: controller.signal })
      .then((ratings) => {
        if (controller.signal.aborted) return;
        this.#ratings = ratings;
        this.#ratingStatus = 'ready';
        this.#renderRatings();
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        this.#ratingStatus = 'error';
        this.update();
      });
  }

  #renderRatings() {
    const focused = document.activeElement;
    const type = focused instanceof HTMLElement ? focused.dataset.type : undefined;
    const sortFocused = focused instanceof HTMLSelectElement && focused.name === 'sort';
    this.update();
    if (type) this.query(`[data-type="${type}"]`)?.focus({ preventScroll: true });
    if (sortFocused) this.find('[name=sort]').focus({ preventScroll: true });
  }

  #refresh() {
    const query = new URLSearchParams(location.search);
    query.delete('page');
    if (this.#filter === 'all') query.delete('type');
    else query.set('type', this.#filter);
    if (this.#sort === 'catalog') query.delete('sort');
    else query.set('sort', this.#sort);
    query.set('view', this.#view);
    history.replaceState(history.state, '', `${location.pathname}?${query}`);
    this.update();
  }
}
