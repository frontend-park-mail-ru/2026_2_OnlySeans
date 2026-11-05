import { store } from '../modules/store.js';

const keys = { favorite: 'frame:favorite-film-ids', watchlater: 'frame:watch-later-film-ids' };
const getKey = (list) => {
  if (list !== 'favorite') return keys[list];
  const user = store.get('user');
  if (!user) return null;
  const identity = user.email?.toLowerCase() || user.id;
  return identity ? `${keys.favorite}:${encodeURIComponent(identity)}` : null;
};

export const getSavedMovieIds = (list) => {
  try {
    const key = getKey(list);
    if (!key) return [];
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(stored)
      ? [...new Set(stored.filter((id) => Number.isSafeInteger(id) && id > 0))]
      : [];
  } catch {
    return [];
  }
};

export const toggleSavedMovie = (list, id) => {
  return setSavedMovie(list, id, !getSavedMovieIds(list).includes(id));
};

export const setSavedMovie = (list, id, active) => {
  const key = getKey(list);
  if (!key) return false;
  const ids = getSavedMovieIds(list);
  const next = active
    ? [id, ...ids.filter((value) => value !== id)]
    : ids.filter((value) => value !== id);
  try {
    localStorage.setItem(key, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
};
