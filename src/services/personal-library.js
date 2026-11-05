import { store } from '../modules/store.js';
import { apiRequest } from '../api/auth.js';
import { getSavedMovieIds, setSavedMovie } from './movie-lists.js';

const empty = () => ({ watched: [], collections: [] });
const identity = (user) => user?.email?.toLowerCase() || (user?.id ? String(user.id) : null);
const keyFor = (user) =>
  identity(user) ? `frame:personal-library:${encodeURIComponent(identity(user))}` : null;
const validId = (id) => Number.isSafeInteger(id) && id > 0;
const ids = (value) => [...new Set(Array.isArray(value) ? value.filter(validId) : [])];
const authError = () =>
  Object.assign(new Error('Войдите, чтобы пользоваться личными коллекциями.'), {
    authRequired: true,
  });

export const readPersonalLibrary = () => {
  const key = keyFor(store.get('user'));
  if (!key) return empty();
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (!value || typeof value !== 'object') return empty();
    return {
      watched: ids(value.watched),
      collections: (Array.isArray(value.collections) ? value.collections : [])
        .filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            /^[a-z0-9-]+$/i.test(item.id) &&
            typeof item.name === 'string',
        )
        .map((item) => ({ id: item.id, name: item.name, filmIds: ids(item.filmIds) })),
    };
  } catch {
    return empty();
  }
};

const requireUser = async () => {
  const before = identity(store.get('user'));
  if (!before) throw authError();
  const result = await apiRequest('/api/authorised');
  if (result.status === 401 || result.status === 403) {
    store.setState({ user: null });
    throw authError();
  }
  if (!result.ok || !result.data?.user)
    throw new Error('Не удалось проверить вход. Попробуйте ещё раз.');
  if (identity(result.data.user) !== before || identity(store.get('user')) !== before)
    throw new Error('Аккаунт изменился. Обновите страницу.');
  return keyFor(result.data.user);
};
const save = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    throw new Error('Не удалось сохранить изменения в этом браузере.');
  }
  return data;
};
const collectionName = (name, data, exceptId) => {
  const clean = String(name).trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > 80)
    throw new Error('Название должно содержать от 1 до 80 символов.');
  if (
    data.collections.some(
      (item) =>
        item.id !== exceptId && item.name.toLocaleLowerCase('ru') === clean.toLocaleLowerCase('ru'),
    )
  )
    throw new Error('Коллекция с таким названием уже есть.');
  return clean;
};
export const loadPersonalLibrary = async () => {
  await requireUser();
  return readPersonalLibrary();
};
export const createPersonalCollection = async (name, filmId) => {
  const key = await requireUser();
  const data = readPersonalLibrary();
  const item = {
    id: crypto.randomUUID(),
    name: collectionName(name, data),
    filmIds: validId(filmId) ? [filmId] : [],
  };
  data.collections.unshift(item);
  save(key, data);
  return item;
};
export const renamePersonalCollection = async (id, name) => {
  const key = await requireUser();
  const data = readPersonalLibrary();
  const item = data.collections.find((item) => item.id === id);
  if (!item) throw new Error('Коллекция не найдена.');
  item.name = collectionName(name, data, id);
  return save(key, data);
};
export const deletePersonalCollection = async (id) => {
  const key = await requireUser();
  const data = readPersonalLibrary();
  data.collections = data.collections.filter((item) => item.id !== id);
  return save(key, data);
};
export const setCollectionMovie = async (collectionId, filmId, included) => {
  if (!validId(filmId)) throw new Error('Фильм не найден.');
  const key = await requireUser();
  const data = readPersonalLibrary();
  const item = data.collections.find((item) => item.id === collectionId);
  if (!item) throw new Error('Коллекция не найдена.');
  item.filmIds = included
    ? [...new Set([...item.filmIds, filmId])]
    : item.filmIds.filter((id) => id !== filmId);
  return save(key, data);
};
export const setMovieWatched = async (filmId, watched, restoreWatchLater) => {
  if (!validId(filmId)) throw new Error('Фильм не найден.');
  const key = await requireUser();
  const data = readPersonalLibrary();
  const old = localStorage.getItem(key);
  const hadBookmark = getSavedMovieIds('watchlater').includes(filmId);
  data.watched = watched
    ? [filmId, ...data.watched.filter((id) => id !== filmId)]
    : data.watched.filter((id) => id !== filmId);
  save(key, data);
  // отметка «Просмотрено» по умолчанию убирает фильм из «Смотреть позже»
  let nextBookmark = restoreWatchLater;
  if (restoreWatchLater === undefined) nextBookmark = !watched && hadBookmark;
  if (nextBookmark !== hadBookmark && !setSavedMovie('watchlater', filmId, nextBookmark)) {
    try {
      if (old === null) localStorage.removeItem(key);
      else localStorage.setItem(key, old);
    } catch {
      /* наружу уходит исходная ошибка хранилища */
    }
    throw new Error('Не удалось обновить «Смотреть позже». Попробуйте ещё раз.');
  }
  return data;
};
