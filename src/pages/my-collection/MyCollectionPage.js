import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import {
  deleteCollection,
  readLibrary,
  renameCollection,
  watchLibrary,
} from '../../services/library.js';
import { filmsByIds } from '../../services/catalog.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { NameDialog } from '../../components/name-dialog/NameDialog.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { BackLink } from '../../components/back-link/BackLink.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('../../components/text-action/text-action.css', import.meta.url));
loadStyles(new URL('./my-collection-page.css', import.meta.url));
const template = await loadTemplate(new URL('./MyCollectionPage.hbs', import.meta.url));

export class MyCollectionPage extends Component {
  static template = template;

  context() {
    return {
      collection: readLibrary().collections.find((item) => item.id === this.props.params.id),
    };
  }

  onRender() {
    const { collection } = this.context();
    this.insert('back', new BackLink({ href: '/my-collections', text: 'Мои коллекции' }));
    if (!collection) {
      document.title = 'Коллекция не найдена | Frame';
      this.insert(
        'feed',
        new StatusMessage({ text: 'Такой коллекции нет. Возможно, её удалили.' }),
      );
      return;
    }
    document.title = `${collection.name} | Frame`;
    this.watch(watchLibrary(() => this.update()));
    this.delegate('click', '[data-action="rename"]', () => this.#rename(collection));
    this.delegate('click', '[data-action="delete"]', () => this.#delete(collection));
    this.#load(collection);
  }

  #load(collection) {
    loadInto(this, 'feed', {
      loading: 'Загружаем фильмы...',
      load: () => filmsByIds(collection.filmIds),
      render: (films) =>
        new FilmFeed({
          title: collection.name,
          level: 1,
          films,
          count: countLabel(films.length, ['фильм', 'фильма', 'фильмов']),
          empty:
            'В коллекции пока нет фильмов. Добавляйте их кнопкой «Моё кино» на карточке фильма.',
          query: this.props.query,
        }),
      failure: () => 'Не удалось загрузить фильмы.',
    });
  }

  #rename(collection) {
    new NameDialog({
      title: 'Переименовать коллекцию',
      value: collection.name,
      submitText: 'Сохранить',
      save: (name) => renameCollection(collection.id, name),
    }).open();
  }

  async #delete(collection) {
    const confirmed = await ConfirmDialog.ask({
      title: `Удалить коллекцию «${collection.name}»?`,
      text: 'Фильмы останутся в каталоге и в других списках.',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!confirmed) return;
    this.props.navigate('/my-collections');
    deleteCollection(collection.id);
  }
}
