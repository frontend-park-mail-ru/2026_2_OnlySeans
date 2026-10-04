import { store } from '../modules/store.js';

export const LISTS = {
  FAVORITES: 'favorites',
  WATCHLIST: 'watchlist',
};

const storageKey = (name) => `frame:${name}:${store.get('user')?.id ?? 'guest'}`;

const read = (name, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(name))) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (name, value) => localStorage.setItem(storageKey(name), JSON.stringify(value));

export const getList = (list) => {
  const ids = read(list, []);
  return Array.isArray(ids) ? ids : [];
};

export const isInList = (list, id) => getList(list).includes(id);

export const toggleInList = (list, id) => {
  const ids = getList(list);
  write(list, ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
};

export const pickFromList = (list, movies) => {
  const ids = getList(list);
  return movies.filter((movie) => ids.includes(movie.id));
};

export const getProfile = () => read('profile', {});

export const saveProfile = (profile) => write('profile', profile);
