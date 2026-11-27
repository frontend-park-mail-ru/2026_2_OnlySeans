import './admin-page.css';
import templateSource from './AdminCatalogPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { getAdminFilms, deleteFilm, adminError } from '../../api/admin.js';
import type { Film } from '../../api/films.js';
import type { PageProps } from '../../app/router.js';
import { AdminCatalogFeed } from '../../components/admin-catalog-feed/AdminCatalogFeed.js';
import { AdminDeleteDialog } from '../../components/admin-delete-dialog/AdminDeleteDialog.js';
import { filterAdminFilms, type AdminFilters } from '../../services/admin-film.js';
import { invalidateCatalog } from '../../services/catalog.js';
import { notify } from '../../services/notice.js';

const template = await loadAssets({ template: templateSource });

/** Бесконечный каталог; фильтры проверяют весь каталог через существующую постраничную ручку. */
export class AdminCatalogPage extends Component<PageProps> {
  static template = template;
  #films: Film[] = [];
  #total = 0;
  #offset = 0;
  #visible = 20;
  #complete = false;
  #loading = false;
  #error = '';
  #feed!: AdminCatalogFeed;
  #controller = new AbortController();
  #filters: AdminFilters = { q: '', type: '', year: '', poster: '', sort: '' };

  context() {
    return { filters: this.#filters };
  }

  onRender() {
    this.#feed = this.insert('feed', new AdminCatalogFeed(this.#feedProps()));
    this.delegate('submit', '[data-filters]', (event) => {
      event.preventDefault();
      this.#applyFilters();
    });
    this.delegate('change', 'select', () => this.#applyFilters());
    this.delegate('click', '[data-reset]', () => {
      this.find<HTMLFormElement>('[data-filters]').reset();
      this.#applyFilters();
    });
    this.watch(() => this.#controller.abort());
    void this.#load();
  }

  #filtered() {
    return Object.values(this.#filters).some(Boolean);
  }

  #feedProps() {
    const filtered = this.#filtered();
    const matches = filterAdminFilms(this.#films, this.#filters);
    return {
      films: matches.slice(0, this.#visible),
      total: this.#total,
      received: this.#offset,
      loading: this.#loading,
      error: this.#error,
      filtered,
      complete: this.#complete && this.#visible >= matches.length,
      onMore: () => {
        if (!this.#loading) {
          this.#visible += 20;
          void this.#load();
        }
      },
      onDelete: (id: number) => void this.#delete(id),
    };
  }

  #draw() {
    if (!this.destroyed) this.#feed.update(this.#feedProps());
  }

  #applyFilters() {
    const data = new FormData(this.find<HTMLFormElement>('[data-filters]'));
    const year = String(data.get('year') || '').trim();
    const invalidYear = Boolean(year && (!/^\d{4}$/.test(year) || +year < 1888 || +year > 2200));
    this.find('[data-filter-error]').textContent = invalidYear
      ? 'Введите год от 1888 до 2200.'
      : '';
    this.find('[name=year]').setAttribute('aria-invalid', String(invalidYear));
    if (invalidYear) return;
    for (const key of Object.keys(this.#filters) as (keyof AdminFilters)[])
      this.#filters[key] = String(data.get(key) || '').trim();
    this.#visible = 20;
    void this.#load();
  }

  async #load() {
    if (this.#loading) {
      this.#draw();
      return;
    }
    this.#loading = true;
    const controller = this.#controller;
    this.#error = '';
    this.#draw();
    try {
      while (!this.#complete && (this.#filtered() || this.#films.length < this.#visible)) {
        const page = await getAdminFilms(this.#offset, controller.signal);
        if (this.destroyed || controller.signal.aborted) return;
        const ids = new Set(this.#films.map((film) => film.id));
        const added = page.films.filter((film) => !ids.has(film.id) && Boolean(ids.add(film.id)));
        if (page.films.length && !added.length) throw new Error('Повторная порция каталога');
        this.#films.push(...added);
        this.#offset += page.films.length;
        this.#total = page.total;
        this.#complete = !page.films.length || this.#offset >= page.total;
        this.#draw();
      }
    } catch (error) {
      if (!controller.signal.aborted) this.#error = adminError(error);
    } finally {
      if (controller === this.#controller) {
        this.#loading = false;
        this.#draw();
      }
    }
  }

  async #delete(id: number) {
    const film = this.#films.find((item) => item.id === id);
    if (!film) return;
    const removed = await AdminDeleteDialog.ask(film, async () => {
      await deleteFilm(id);
      invalidateCatalog();
    });
    if (!removed || this.destroyed) return;
    notify('Фильм удалён', { type: 'success' });
    this.#controller.abort();
    this.#controller = new AbortController();
    this.#films = [];
    this.#offset = 0;
    this.#complete = false;
    this.#loading = false;
    this.#visible = 20;
    void this.#load();
  }
}
