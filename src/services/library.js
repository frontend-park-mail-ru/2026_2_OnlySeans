import { store } from '../core/store.js';
import { eventBus } from '../core/event-bus.js';
import { readJson, writeJson } from './storage.js';

export const LISTS = ['favorite', 'watchlater', 'watched'];

const storageKey = () => {
  const user = store.get('user');
  return user ? `frame:library:${user.id ?? user.email}` : null;
};

const empty = () => ({ favorite: [], watchlater: [], watched: [] });

export function readLibrary() {
  const key = storageKey();
  const data = key ? readJson(key, null) : null;
  return { ...empty(), ...(data && typeof data === 'object' ? data : {}) };
}

function save(data) {
  const key = storageKey();
  if (!key) throw new Error('Войдите, чтобы сохранять фильмы.');
  if (!writeJson(key, data)) throw new Error('Не удалось сохранить изменения в этом браузере.');
  eventBus.emit('library:change', data);
  return data;
}

export const isSaved = (list, filmId) => readLibrary()[list].includes(filmId);

function setSaved(list, filmId, saved) {
  const data = readLibrary();
  const ids = data[list].filter((id) => id !== filmId);
  data[list] = saved ? [filmId, ...ids] : ids;

  if (list === 'watched' && saved) data.watchlater = data.watchlater.filter((id) => id !== filmId);
  return save(data);
}

export const toggleSaved = (list, filmId) => setSaved(list, filmId, !isSaved(list, filmId));

export const watchLibrary = (handler) => eventBus.on('library:change', handler);
