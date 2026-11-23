import './movie-actions.css';
import templateSource from './MovieActions.hbs';
import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { isSaved, toggleSaved, watchLibrary } from '../../services/library.js';
import { notify } from '../../services/notice.js';
import { loginPathHere } from '../../services/auth-return.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });
const heartIcon = new URL('../../assets/icons/film-heart.svg', import.meta.url).href;
const eyeIcon = new URL('../../assets/icons/film-eye.svg', import.meta.url).href;
const plusIcon = new URL('../../assets/icons/film-plus.svg', import.meta.url).href;
const shareIcon = new URL('../../assets/icons/film-share.svg', import.meta.url).href;

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
  #busy = false;

  context() {
    const { film, variant = 'card' } = this.props;
    const favorite = isSaved('favorite', film.id);
    const watchlater = isSaved('watchlater', film.id);
    const watched = isSaved('watched', film.id);
    return {
      variant,
      wide: variant === 'hero',
      heartIcon,
      eyeIcon,
      plusIcon,
      shareIcon,
      busy: this.#busy,
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
    this.findAll<HTMLButtonElement>('[data-list]').forEach((button) => {
      button.disabled = this.#busy;
    });
    this.delegate('click', '[data-list]', (event, button) => this.#toggle(button.dataset.list));
    this.delegate('click', '[data-share]', () => this.#share());
    this.watch(watchLibrary(() => this.#refresh()));
    this.watch(store.watch('user', () => this.#refresh()));
  }

  async #toggle(list) {
    if (this.#busy) return;
    if (!store.get('user')) {
      notify(GUEST_MESSAGE[list], {
        type: 'error',
        action: { label: 'Войти', href: loginPathHere() },
      });
      return;
    }
    try {
      this.#busy = true;
      this.#refresh();
      await toggleSaved(list, this.props.film.id);
    } catch (error) {
      notify(error.message, { type: 'error' });
    } finally {
      this.#busy = false;
      if (this.element) this.#refresh();
    }
  }

  async #share() {
    const url = new URL(`/film/${this.props.film.id}`, location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: this.props.film.title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Ссылка на фильм скопирована.', { type: 'success' });
      }
    } catch (error) {
      if (error.name !== 'AbortError') notify('Не удалось поделиться ссылкой.', { type: 'error' });
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
