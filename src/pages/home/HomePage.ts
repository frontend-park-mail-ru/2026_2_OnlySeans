import './home-page.css';
import templateSource from './HomePage.hbs';
import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { store } from '../../core/store.js';
import { loadCatalog } from '../../services/catalog.js';
import { getCollections } from '../../api/collections.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { ConfiguredBlocks } from '../../components/configured-blocks/ConfiguredBlocks.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { Spotlight } from './spotlight/Spotlight.js';
import { WatchLater } from './watch-later/WatchLater.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class HomePage extends Component {
  static template = template;
  #collections: Awaited<ReturnType<typeof getCollections>> = [];
  #configuredBlocks?: ConfiguredBlocks;
  #configuredSignature = '';

  onRender() {
    this.#collections = [];
    this.#configuredBlocks = undefined;
    this.#configuredSignature = '';
    document.title = 'Frame';
    this.insert(
      'collections-heading',
      new SectionHeading({
        title: 'Подборки',
        link: { href: '/collections', text: 'Все подборки' },
      }),
    );
    this.#loadCatalog();
    this.#loadCollections();
    this.#showConfiguredBlocks();
    this.watch(store.watch('onlineconf', () => this.#showConfiguredBlocks()));
  }

  #showConfiguredBlocks() {
    const blocks: ConfiguredBlocks['props']['blocks'] = [];
    for (const block of store.get('onlineconf').homeBlocks) {
      if (block.type === 'banner') {
        blocks.push(block);
      } else {
        const collection = this.#collections.find((item) => item.id === block.id);
        if (collection) blocks.push({ type: 'collection', collection });
      }
    }
    const signature = JSON.stringify(blocks.map((block) => block.type === 'banner' ? block : block.collection.id));
    if (this.#configuredSignature === signature) return;
    this.#configuredSignature = signature;
    if (this.#configuredBlocks) this.remove(this.#configuredBlocks);
    this.#configuredBlocks = blocks.length
      ? this.insert(this.find('[data-configured-blocks]'), new ConfiguredBlocks({ blocks }))
      : undefined;
  }

  #loadCatalog() {
    loadInto(this, 'spotlight', {
      loading: 'Загружаем фильм недели...',
      load: loadCatalog,
      render: (films) => {
        if (store.get('user')) this.insert('watch-later', new WatchLater({ films }));
        else this.find('[data-slot="watch-later"]').remove();
        this.insert(
          'feed',
          new FilmFeed({
            anchor: 'feed',
            title: 'Лента',
            note: 'Знакомые истории и новые открытия.',
            films,
            count: countLabel(films.length, [
              'фильм и сериал',
              'фильма и сериала',
              'фильмов и сериалов',
            ]),
            empty: 'Каталог пока пуст.',
            query: this.props.query,
          }),
        );
        return films.length
          ? new Spotlight({ films })
          : new StatusMessage({ text: 'Каталог пока пуст.' });
      },
      failure: () => 'Не удалось загрузить каталог.',
    });
  }

  #loadCollections() {
    const grid = this.find('.home-page__collection-grid');
    loadInto(this, grid, {
      loading: 'Загружаем подборки...',
      load: getCollections,
      render: (collections) => {
        this.#collections = collections;
        this.#showConfiguredBlocks();
        collections
          .slice(0, 3)
          .forEach((item) =>
            this.insert(grid, new CollectionCard({ ...item, href: `/collections/${item.id}` })),
          );
        return collections.length ? null : new StatusMessage({ text: 'Подборок пока нет.' });
      },
      failure: () => 'Не удалось загрузить подборки.',
    });
  }
}
