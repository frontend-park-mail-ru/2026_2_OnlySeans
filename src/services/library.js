import { store } from '../core/store.js';
import { eventBus } from '../core/event-bus.js';
import { readJson, writeJson } from './storage.js';
import { getProfile, setFavorite } from '../api/profile.js';

let serverFavorites = [];
let pendingFavorites = Promise.resolve();
let activeKey = null;

export const LISTS = ['favorite', 'watchlater', 'watched'];

const storageKey = () => {
  const user = store.get('user');
  return user ? `frame:library:${user.id ?? user.email}` : null;
};

const empty = () => ({ favorite: [], watchlater: [], watched: [] });

function readLocalLibrary(key = storageKey()) {
  const data = key ? readJson(key, null) : null;
  return { ...empty(), ...(data && typeof data === 'object' ? data : {}) };
}

export function readLibrary() {
  const data = readLocalLibrary();
  return { ...data, favorite: [...new Set([...serverFavorites, ...data.favorite])] };
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
  const data = readLocalLibrary();
  const ids = data[list].filter((id) => id !== filmId);
  data[list] = saved ? [filmId, ...ids] : ids;

  if (list === 'watched' && saved) data.watchlater = data.watchlater.filter((id) => id !== filmId);
  return save(data);
}

async function syncFavorites(key) {
  const { favorites } = await getProfile();
  const remote = new Set(favorites.map((film) => film.id));
  const local = readLocalLibrary(key).favorite;
  const synced = await Promise.allSettled(local.map(async (filmId) => {
    if (!remote.has(filmId)) await setFavorite(filmId, true);
    remote.add(filmId);
  }));

  if (storageKey() !== key) return;
  serverFavorites = [...remote];
  const data = readLocalLibrary(key);
  data.favorite = local.filter((_, index) => synced[index].status === 'rejected');
  writeJson(key, data);
  eventBus.emit('library:change', readLibrary());
}

store.watch('user', (user) => {
  const key = storageKey();
  if (key === activeKey) return;
  activeKey = key;
  serverFavorites = [];
  pendingFavorites = user ? syncFavorites(key).catch(() => {}) : Promise.resolve();
  eventBus.emit('library:change', readLibrary());
});

export function toggleSaved(list, filmId) {
  if (list !== 'favorite') return setSaved(list, filmId, !isSaved(list, filmId));

  const key = storageKey();
  const update = pendingFavorites.then(async () => {
    if (!key || storageKey() !== key) return;
    const saved = !isSaved(list, filmId);
    await setFavorite(filmId, saved);
    if (storageKey() !== key) return;
    serverFavorites = serverFavorites.filter((id) => id !== filmId);
    if (saved) serverFavorites.unshift(filmId);
    const data = readLocalLibrary(key);
    data.favorite = data.favorite.filter((id) => id !== filmId);
    writeJson(key, data);
    eventBus.emit('library:change', readLibrary());
  });
  pendingFavorites = update.catch(() => {});
  return update;
}

export const waitForFavorites = () => pendingFavorites;

export const watchLibrary = (handler) => eventBus.on('library:change', handler);
