import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { store } from '../../core/store.js';
import { loadCatalog } from '../../services/catalog.js';
import { getCollections } from '../../api/collections.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { Spotlight } from './spotlight/Spotlight.js';
import { WatchLater } from './watch-later/WatchLater.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./home-page.css', import.meta.url));
const template = await loadTemplate(new URL('./HomePage.hbs', import.meta.url));

export class HomePage extends Component {
  static template = template;

  onRender() {
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
