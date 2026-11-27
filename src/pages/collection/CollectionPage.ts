import './collection-page.css';
import templateSource from './CollectionPage.hbs';
import { Component } from '../../core/component.js';
import { getCollection, getCollections } from '../../api/collections.js';
import { loadCatalog } from '../../services/catalog.js';
import {
  resolveLocalCollections,
  readLocalCollections,
  readCollectionSnapshot,
  deleteLocalCollection,
  type Collection,
} from '../../services/collections.js';
import { store } from '../../core/store.js';
import { readJson, StorageKey } from '../../services/storage.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { CollectionHero } from './CollectionHero.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import { Skeleton } from '../../components/skeleton/Skeleton.js';
import type { Modal } from '../../components/modal/Modal.js';
import { loadAssets } from '../../core/assets.js';
import type { PageProps } from '../../app/router.js';
const template = await loadAssets({ template: templateSource });
export class CollectionPage extends Component<PageProps> {
  static template = template;
  #collection: Collection | null = null;
  #similar: Collection[] = [];
  #phase: 'loading' | 'ready' | 'error' = 'loading';
  #notFound = false;
  #dialog: Modal | null = null;
  #sort = 'catalog';
  #feed: Component | null = null;
  constructor(props: PageProps) {
    super(props);
    const sort = props.query.get('sort');
    if (sort === 'title' || sort === 'year') this.#sort = sort;
  }
  context() {
    return {
      ready: this.#phase === 'ready',
      local: this.#collection?.local,
      title: this.#collection?.title,
      count: this.#collection?.films.length,
      similar: this.#similar.length > 0,
      backIcon: new URL('../../assets/icons/person-back.svg', import.meta.url).href,
      shareIcon: new URL('../../assets/icons/person-share.svg', import.meta.url).href,
    };
  }
  onRender() {
    this.#feed = null;
    document.title = this.#collection ? this.#collection.title + ' | Frame' : 'Подборка | Frame';
    this.find<HTMLButtonElement>('[data-mobile-share]').disabled = this.#phase !== 'ready';
    this.watch(
      store.watch('user', () => {
        this.#dialog?.close();
        this.#phase = 'loading';
        this.update();
      }),
    );
    if (this.#phase === 'loading') {
      this.insert('state', new Skeleton({ variant: 'catalog' }));
      const controller = new AbortController();
      this.watch(() => controller.abort());
      const owner = store.get('user')?.id;
      void this.#load(controller.signal).then(() => {
        if (!controller.signal.aborted && owner === store.get('user')?.id) this.update();
      });
      return;
    }
    if (this.#phase === 'error') {
      this.insert(
        'state',
        new EmptyState({
          variant: 'error',
          title: this.#notFound ? 'Подборка не найдена' : 'Не удалось загрузить подборку',
          requestError: !this.#notFound,
          text: this.#notFound
            ? this.props.params.id?.startsWith('local-')
              ? 'Личные подборки доступны только своему аккаунту на устройстве, где они созданы.'
              : 'Возможно, ссылка устарела или подборку удалили.'
            : 'Проверьте соединение и повторите попытку.',
          button: this.#notFound ? undefined : 'Повторить',
          onRetry: this.#notFound
            ? undefined
            : () => {
                this.#phase = 'loading';
                this.update();
              },
          href: '/collections',
          linkText: 'Все подборки',
        }),
      );
      return;
    }
    const collection = this.#collection!;
    this.delegate('click', '[data-mobile-share]', () =>
      this.find<HTMLButtonElement>('.collection-hero [data-share]').click(),
    );
    this.insert('hero', new CollectionHero(collection));
    this.#renderFeed();
    this.find<HTMLSelectElement>('[name=sort]').value = this.#sort;
    this.delegate('change', '[name=sort]', (_, select) => {
      this.#sort = (select as HTMLSelectElement).value;
      const query = new URLSearchParams(location.search);
      query.set('sort', this.#sort);
      history.replaceState(history.state, '', `${location.pathname}?${query}`);
      this.#renderFeed();
    });
    const host = this.query('[data-similar]');
    if (host)
      this.#similar.forEach((item) =>
        this.insert(host, new CollectionCard({ ...item, href: '/collections/' + item.id })),
      );
    this.delegate('click', '[data-edit]', async () => {
      const controller = new AbortController();
      this.watch(() => controller.abort());
      try {
        const films = await loadCatalog({ signal: controller.signal });
        if (controller.signal.aborted) return;
        const { CollectionEditor } = await import('../collections/CollectionEditor.js');
        if (this.destroyed || controller.signal.aborted) return;
        this.#dialog = new CollectionEditor({
          films,
          collection: readLocalCollections().find((item) => item.id === String(collection.id)),
          onSaved: () => {
            if (this.destroyed) return;
            this.#phase = 'loading';
            this.update();
          },
        }).open();
      } catch {
        if (!controller.signal.aborted)
          this.find('[data-local-status]').textContent =
            'Не удалось загрузить фильмы для редактирования. Попробуйте ещё раз.';
      }
    });
    this.delegate('click', '[data-delete]', () => {
      this.#dialog = new ConfirmDialog({
        title: 'Удалить подборку?',
        text: 'Фильмы и ваши оценки останутся в профиле.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        danger: true,
        resolve: (confirmed: boolean) => {
          if (!confirmed || this.destroyed) return;
          try {
            deleteLocalCollection(String(collection.id));
            this.props.navigate('/collections?tab=mine');
          } catch (error) {
            this.find('[data-local-status]').textContent = error.message;
          }
        },
      }).open();
    });
    if (this.props.restoreScroll != null) {
      const frame = requestAnimationFrame(() => window.scrollTo(0, this.props.restoreScroll!));
      this.watch(() => cancelAnimationFrame(frame));
    }
  }
  async #load(signal: AbortSignal) {
    try {
      const id = this.props.params.id;
      if (id === 'snapshot' || id?.startsWith('local-')) {
        const catalog = await loadCatalog({ signal });
        signal.throwIfAborted();
        this.#collection =
          id === 'snapshot'
            ? readCollectionSnapshot(this.props.query, catalog)
            : (resolveLocalCollections(catalog).find((item) => item.id === id) ?? null);
        if (!this.#collection) {
          this.#notFound = true;
          this.#phase = 'error';
          return;
        }
      } else this.#collection = await getCollection(id!, { signal });
      signal.throwIfAborted();
      this.#phase = 'ready';
      this.#notFound = false;
      try {
        const all = await getCollections({ signal });
        signal.throwIfAborted();
        const genres = new Set(this.#collection.films.flatMap((film) => film.genres));
        this.#similar = all
          .filter((item) => String(item.id) !== String(this.#collection!.id))
          .map((item) => ({
            item,
            score: item.films.flatMap((film) => film.genres).filter((genre) => genres.has(genre))
              .length,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((value) => value.item);
      } catch {
        this.#similar = [];
      }
    } catch (error) {
      if (signal.aborted) return;
      this.#notFound = error.status === 404 || this.props.params.id === 'snapshot';
      this.#phase = 'error';
    }
  }
  #renderFeed() {
    const films = [...this.#collection!.films];
    if (!films.length) {
      const empty = new EmptyState({
        variant: 'collections',
        unit: 'фильмов в подборке',
        title: 'Подборка пока пуста',
        text: this.#collection!.local
          ? 'Откройте редактирование, чтобы добавить фильмы.'
          : 'Фильмы появятся, когда редакция их добавит.',
        href: '/collections',
        linkText: 'Все подборки',
        level: 2,
      });
      this.#feed = this.#feed ? this.swap(this.#feed, empty) : this.insert('feed', empty);
      return;
    }
    if (this.#sort === 'title') films.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    if (this.#sort === 'year') films.sort((a, b) => b.year - a.year);
    const next = new FilmFeed({
      title: 'Фильмы подборки',
      films,
      count: films.length,
      empty: 'В подборке нет доступных фильмов.',
      query: this.props.query,
      ranked: true,
      audienceRatings: true,
      initialView:
        new URLSearchParams(location.search).get('view') ||
        readJson(
          StorageKey.CATALOG_VIEW,
          matchMedia('(max-width: 767px)').matches ? 'list' : 'grid',
        ),
      onViewChange: (view) => {
        const query = new URLSearchParams(location.search);
        query.set('view', view);
        history.replaceState(history.state, '', `${location.pathname}?${query}`);
      },
    });
    if (this.#feed) this.#feed = this.swap(this.#feed, next);
    else this.#feed = this.insert('feed', next);
  }
  destroy() {
    this.#dialog?.close();
    super.destroy();
  }
}
