import './collections-page.css';
import templateSource from './CollectionsPage.hbs';
import { Component } from '../../core/component.js';
import { getCollections } from '../../api/collections.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class CollectionsPage extends Component {
  static template = template;

  onRender() {
    document.title = 'Подборки | Frame';
    this.insert('heading', new SectionHeading({ title: 'Подборки', level: 1 }));
    this.#load();
  }

  #load() {
    const grid = this.find('.collections-page__grid');
    loadInto(this, grid, {
      loading: 'Загружаем подборки...',
      load: getCollections,
      render: (collections) => {
        collections.forEach((item) =>
          this.insert(grid, new CollectionCard({ ...item, href: `/collections/${item.id}` })),
        );
        return collections.length ? null : new StatusMessage({ text: 'Подборок пока нет.' });
      },
      failure: () => 'Не удалось загрузить подборки.',
    });
  }
}
