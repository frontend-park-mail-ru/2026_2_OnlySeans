import { store } from '../core/store.js';
import { eventBus } from '../core/event-bus.js';
import { request } from '../api/http.js';

export const LISTS = ['favorite', 'watchlater', 'watched'];

const empty = () => ({ favorite: [], watchlater: [], watched: [] });

let library = empty();
let owner = null;
let queue = Promise.resolve();

const currentUserId = () => store.get('user')?.id ?? null;

function remember(data, userId) {
  if (currentUserId() !== userId) return;
  owner = userId;
  library = { ...empty(), ...data };
  eventBus.emit('library:change', library);
}

function reset() {
  owner = null;
  library = empty();
  eventBus.emit('library:change', library);
}

export const readLibrary = () => (owner !== null && owner === currentUserId() ? library : empty());

export const isSaved = (list, filmId) => readLibrary()[list].includes(filmId);

export async function loadLibrary() {
  const userId = currentUserId();
  if (!userId) {
    reset();
    return;
  }
  await queue;
  remember(await request('/me/library'), userId);
}

function change(action) {
  const userId = currentUserId();
  if (!userId) return Promise.reject(new Error('Войдите, чтобы сохранять фильмы.'));
  const next = queue.then(() => {
    if (currentUserId() !== userId) throw new Error('Пользователь изменился. Повторите действие.');
    return action(userId);
  });
  queue = next.catch(() => {});
  return next;
}

export const toggleSaved = (list, filmId) =>
  change(async (userId) => {
    const data = await request(`/me/library/lists/${list}/${filmId}`, {
      method: 'PUT',
      body: { saved: !isSaved(list, filmId) },
    });
    remember(data, userId);
  });

export const watchLibrary = (handler) => eventBus.on('library:change', handler);

export const waitForFavorites = () => queue;
