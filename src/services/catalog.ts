import { getFilms } from '../api/films.js';

const FRESH_MS = 60_000;
let cache = null;

export function loadCatalog() {
  if (!cache || Date.now() - cache.at > FRESH_MS) {
    const promise = getFilms().catch((error) => {
      cache = null;
      throw error;
    });
    cache = { at: Date.now(), promise };
  }
  return cache.promise;
}

export async function filmsByIds(ids) {
  const byId = new Map((await loadCatalog()).map((film) => [film.id, film]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}
