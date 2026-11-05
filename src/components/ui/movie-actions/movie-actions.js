import { getSavedMovieIds, toggleSavedMovie } from '../../../services/movie-lists.js';
import { store } from '../../../modules/store.js';
import { apiRequest } from '../../../api/auth.js';
import { showFavoriteNotice } from './favorite-notice.js';
import { element } from '../../../utils/dom.js';

const LIST_BUTTON_LABELS = {
  favorite: { add: 'В избранное', remove: 'Убрать из избранного' },
  watchlater: { add: 'Смотреть позже', remove: 'Убрать из «Смотреть позже»' },
};
const listButtonLabel = (list, active) => {
  const labels = list === 'favorite' ? LIST_BUTTON_LABELS.favorite : LIST_BUTTON_LABELS.watchlater;
  return active ? labels.remove : labels.add;
};

const showSaveError = (page, message) => {
  let status = page.querySelector('.movie-list-status');
  if (!status) {
    status = element('p');
    status.className = 'movie-list-status';
    status.setAttribute('role', 'status');
    page.querySelector('main').prepend(status);
  }
  status.textContent = message;
};

const paths = {
  favorite:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  watchlater: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
};

export const syncMovieListButtons = (page) => {
  const saved = {
    favorite: getSavedMovieIds('favorite'),
    watchlater: getSavedMovieIds('watchlater'),
  };
  page.querySelectorAll('[data-movie-list]').forEach((button) => {
    const list = button.dataset.movieList;
    const active = saved[list].includes(Number(button.dataset.movieId));
    const action = listButtonLabel(list, active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${action}: ${button.dataset.movieTitle}`);
    button.title = action;
  });
};

export const createMovieListButton = (movie, page, list) => {
  const button = element('button');
  button.type = 'button';
  button.className = `movie-list-button movie-list-button--${list}`;
  button.dataset.movieList = list;
  button.dataset.movieId = movie.id;
  button.dataset.movieTitle = movie.title;
  button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[list]}"></path></svg>`;
  const active = getSavedMovieIds(list).includes(movie.id);
  const label = listButtonLabel(list, active);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', `${label}: ${movie.title}`);
  button.title = label;
  button.addEventListener('click', async () => {
    if (list === 'favorite') {
      if (!store.get('user')) {
        showFavoriteNotice();
        return;
      }
      button.disabled = true;
      try {
        const { ok, status, data } = await apiRequest('/api/authorised');
        if (!page.isConnected) return;
        if (status === 401 || status === 403) {
          store.setState({ user: null });
          syncMovieListButtons(page);
          page.dispatchEvent(
            new CustomEvent('movielistchange', { detail: { list: 'favorite', undo: true } }),
          );
          showFavoriteNotice();
          return;
        }
        if (!ok || !data?.user) {
          showSaveError(page, 'Не удалось проверить вход. Попробуйте ещё раз.');
          return;
        }
        store.setState({ user: data.user });
      } catch {
        if (page.isConnected) showSaveError(page, 'Не удалось проверить вход. Попробуйте ещё раз.');
        return;
      } finally {
        button.disabled = false;
      }
    }
    if (!toggleSavedMovie(list, movie.id)) {
      showSaveError(page, 'Не удалось сохранить список в этом браузере.');
      return;
    }
    page.querySelector('.movie-list-status')?.remove();
    syncMovieListButtons(page);
    if (
      page.classList.contains('home-club') &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      button.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
        { duration: 260, easing: 'ease-out' },
      );
    }
    page.dispatchEvent(new CustomEvent('movielistchange', { detail: { list, id: movie.id } }));
  });
  return button;
};
