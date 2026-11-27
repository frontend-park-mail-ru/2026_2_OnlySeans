import './collections-page.css';
import templateSource from './CollectionsPage.hbs';
import { Component } from '../../core/component.js';
import { getCollections } from '../../api/collections.js';
import { loadCatalog } from '../../services/catalog.js';
import {
  resolveLocalCollections,
  savedCollections,
  type Collection,
} from '../../services/collections.js';
import { store } from '../../core/store.js';
import { notify } from '../../services/notice.js';
import { watchPreferences } from '../../services/storage.js';
import type { Film } from '../../api/films.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';
import { CollectionHero } from '../collection/CollectionHero.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import type { CollectionEditor } from './CollectionEditor.js';
const template = await loadAssets({ template: templateSource });
export class CollectionsPage extends Component<PageProps> {
  static template = template;
  #items: Collection[] = [];
  #catalog: Film[] = [];
  #phase: 'loading' | 'ready' = 'loading';
  #error = false;
  #catalogError = false;
  #editor: CollectionEditor | null = null;
  #tab: string;
  #sort: string;
  constructor(props: PageProps) {
    super(props);
    this.#tab = ['editorial', 'community', 'mine', 'saved'].includes(props.query.get('tab') || '')
      ? props.query.get('tab')!
      : 'all';
    this.#sort = ['title', 'count'].includes(props.query.get('sort') || '')
      ? props.query.get('sort')!
      : 'catalog';
  }
  #all() {
    return [...this.#items, ...resolveLocalCollections(this.#catalog)];
  }
  #filtered() {
    const saved = new Set(savedCollections());
    let items = this.#all().filter((item) =>
      this.#tab === 'community'
        ? false
        : this.#tab === 'mine'
          ? item.local
          : this.#tab === 'editorial'
            ? !item.local
            : this.#tab === 'saved'
              ? saved.has(String(item.id))
              : true,
    );
    if (this.#sort === 'title') items = items.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    if (this.#sort === 'count') items = items.sort((a, b) => b.films.length - a.films.length);
    return items;
  }
  #href(tab = this.#tab, sort = this.#sort) {
    return '/collections?' + new URLSearchParams({ tab, sort });
  }
  context() {
    const all = this.#all();
    return {
      loading: this.#phase === 'loading',
      error: this.#error,
      catalogError: this.#catalogError,
      count: this.#filtered().length,
      empty: !this.#filtered().length,
      showEmpty:
        !this.#filtered().length &&
        !this.#error &&
        !this.#catalogError &&
        this.#tab !== 'community',
      showMessage:
        !this.#filtered().length &&
        (this.#error || this.#catalogError || this.#tab === 'community'),
      community: this.#tab === 'community',
      tabs: [
        { value: 'all', label: 'Все', count: all.length },
        { value: 'editorial', label: 'Редакция', count: this.#items.length },
        { value: 'community', label: 'Сообщество', count: 0 },
        { value: 'mine', label: 'Мои', count: all.filter((item) => item.local).length },
        {
          value: 'saved',
          label: 'Сохранённые',
          count: all.filter((item) => savedCollections().includes(String(item.id))).length,
        },
      ].map((tab) => ({
        ...tab,
        href: this.#href(tab.value),
        current: tab.value === this.#tab ? 'page' : 'false',
      })),
    };
  }
  onRender() {
    document.title = 'Подборки | Frame';
    this.insert('heading', new SectionHeading({ title: 'Подборки', level: 1 }));
    if (this.#phase === 'loading') {
      this.insert('state', new Skeleton({ variant: 'collections' }));
      const controller = new AbortController();
      this.watch(() => controller.abort());
      const owner = store.get('user')?.id;
      void Promise.allSettled([
        getCollections({ signal: controller.signal }),
        loadCatalog({ signal: controller.signal }),
      ]).then(([items, catalog]) => {
        if (controller.signal.aborted || owner !== store.get('user')?.id) return;
        this.#items = items.status === 'fulfilled' ? items.value : [];
        this.#catalog = catalog.status === 'fulfilled' ? catalog.value : [];
        this.#error = items.status === 'rejected';
        this.#catalogError = catalog.status === 'rejected';
        this.#phase = 'ready';
        this.update();
      });
      return;
    }
    this.watch(
      store.watch('user', () => {
        this.#editor?.close();
        this.update();
      }),
    );
    this.watch(watchPreferences(() => this.update()));
    const host = this.find('.collections-page__grid');
    if (this.query('[data-slot=empty]'))
      this.insert(
        'empty',
        new EmptyState({
          variant: 'collections',
          unit: 'подборок',
          title: this.#tab === 'all' ? 'Подборок пока нет' : 'В этом разделе пока нет подборок',
          text:
            this.#tab === 'all'
              ? 'Редакция собирает первые списки на вечер.'
              : this.#tab === 'mine'
                ? 'Создайте свою подборку из фильмов каталога.'
                : 'Выберите другую вкладку или сохраните понравившуюся подборку.',
          level: 2,
        }),
      );
    this.#filtered().forEach((item) =>
      this.insert(host, new CollectionCard({ ...item, href: '/collections/' + item.id })),
    );
    const hero = this.query('[data-featured]');
    if (hero && this.#items[0])
      this.insert(hero, new CollectionHero({ ...this.#items[0], featured: true }));
    this.find<HTMLSelectElement>('[name=sort]').value = this.#sort;
    this.delegate('change', '[name=sort]', (_, select) =>
      this.props.navigate(this.#href(this.#tab, (select as HTMLSelectElement).value)),
    );
    this.delegate('click', '[data-retry]', () => {
      this.#phase = 'loading';
      this.update();
    });
    this.delegate('click', '[data-create]', async () => {
      if (!store.get('user')) {
        notify('Войдите, чтобы создать подборку');
        return;
      }
      if (this.#catalogError) {
        notify('Сначала повторите загрузку каталога');
        return;
      }
      try {
        const { CollectionEditor } = await import('./CollectionEditor.js');
        if (this.destroyed) return;
        this.#editor = new CollectionEditor({
          films: this.#catalog,
          onSaved: (id: string) => {
            if (!this.destroyed) this.props.navigate('/collections/' + id);
          },
        }).open();
      } catch {
        if (!this.destroyed)
          notify('Не удалось открыть редактор подборки. Повторите попытку.', { type: 'error' });
      }
    });
  }
  destroy() {
    this.#editor?.close();
    super.destroy();
  }
}
