import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { isSaved, toggleSaved, watchLibrary } from '../../services/library.js';
import { notify } from '../../services/notice.js';
import { loginPathHere } from '../../services/auth-return.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./movie-actions.css', import.meta.url));
const template = await loadTemplate(new URL('./MovieActions.hbs', import.meta.url));

const LABELS = {
  favorite: ['В избранное', 'Убрать из избранного'],
  watchlater: ['Смотреть позже', 'Убрать из «Смотреть позже»'],
  watched: ['Отметить просмотренным', 'Убрать из просмотренного'],
};

const GUEST_MESSAGE = {
  favorite: 'Войдите, чтобы добавлять фильмы в избранное.',
  watchlater: 'Войдите, чтобы откладывать фильмы на потом.',
  watched: 'Войдите, чтобы отмечать просмотренные фильмы.',
};

export class MovieActions extends Component {
  static template = template;

  context() {
    const { film, variant = 'card' } = this.props;
    const favorite = isSaved('favorite', film.id);
    const watchlater = isSaved('watchlater', film.id);
    const watched = isSaved('watched', film.id);
    return {
      variant,
      wide: variant === 'hero',
      title: film.title,
      favorite,
      watchlater,
      watched,
      favoriteLabel: LABELS.favorite[Number(favorite)],
      watchlaterLabel: LABELS.watchlater[Number(watchlater)],
      watchedLabel: LABELS.watched[Number(watched)],
    };
  }

  onRender() {
    this.delegate('click', '[data-list]', (event, button) => this.#toggle(button.dataset.list));
    this.watch(watchLibrary(() => this.#refresh()));
    this.watch(store.watch('user', () => this.#refresh()));
  }

  #toggle(list) {
    if (!store.get('user')) {
      notify(GUEST_MESSAGE[list], {
        type: 'error',
        action: { label: 'Войти', href: loginPathHere() },
      });
      return;
    }
    try {
      toggleSaved(list, this.props.film.id);
    } catch (error) {
      notify(error.message, { type: 'error' });
    }
  }

  #refresh() {
    const focused = this.element.contains(document.activeElement)
      ? document.activeElement.classList[1]
      : null;
    this.update();
    if (focused) this.find(`.${focused}`)?.focus({ preventScroll: true });
  }
}
