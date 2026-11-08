import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { createCollection, readLibrary, watchLibrary } from '../../services/library.js';
import { filmsByIds } from '../../services/catalog.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { Button } from '../../components/button/Button.js';
import { CollectionCard } from '../../components/collection-card/CollectionCard.js';
import { NameDialog } from '../../components/name-dialog/NameDialog.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./my-collections-page.css', import.meta.url));
const template = await loadTemplate(new URL('./MyCollectionsPage.hbs', import.meta.url));

const FORMS = ['коллекция', 'коллекции', 'коллекций'];

export class MyCollectionsPage extends Component {
  static template = template;

  onRender() {
    document.title = 'Мои коллекции | Frame';
    const { collections } = readLibrary();
    const create = new Button({
      text: 'Новая коллекция',
      iconBefore: 'plus',
      onClick: () => this.#create(),
    });
    this.insert(
      'heading',
      new SectionHeading({
        title: 'Мои коллекции',
        level: 1,
        count: collections.length ? countLabel(collections.length, FORMS) : '',
        tools: create,
      }),
    );
    this.watch(watchLibrary(() => this.update()));
    this.#showCards(collections);
  }

  #create() {
    new NameDialog({
      title: 'Новая коллекция',
      placeholder: 'Например, пересмотреть зимой',
      submitText: 'Создать',
      save: (name) => createCollection(name),
    }).open();
  }

  #showCards(collections) {
    const grid = this.find('.my-collections__grid');
    if (!collections.length) {
      this.insert(
        grid,
        new StatusMessage({ text: 'Коллекций пока нет. Создайте первую кнопкой выше.' }),
      );
      return;
    }
    loadInto(this, grid, {
      loading: 'Загружаем коллекции...',
      load: () => Promise.all(collections.map((item) => filmsByIds(item.filmIds))),
      render: (films) => {
        collections.forEach((item, index) =>
          this.insert(
            grid,
            new CollectionCard({
              title: item.name,
              films: films[index],
              href: `/my-collections/${item.id}`,
            }),
          ),
        );
      },
      failure: () => 'Не удалось загрузить фильмы коллекций.',
    });
  }
}
