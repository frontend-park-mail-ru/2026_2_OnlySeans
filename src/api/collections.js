import { request } from './http.js';
import { toFilm } from './films.js';

const toCollection = (collection) => ({
  id: collection.id,
  title: collection.title,
  description: collection.description || '',
  films: (collection.films || []).map(toFilm),
});

export async function getCollections({ signal } = {}) {
  const collections = [];
  let total = Infinity;
  while (collections.length < total) {
    const data = await request('/collections', {
      params: { limit: 100, offset: collections.length },
      signal,
    });
    if (!data.collections.length) break;
    collections.push(...data.collections.map(toCollection));
    total = data.total;
  }
  return collections;
}

export async function getCollection(id, { signal } = {}) {
  let collection = null;
  const films = [];
  let total = Infinity;
  while (films.length < total) {
    const data = await request(`/collections/${encodeURIComponent(id)}`, {
      params: { limit: 100, offset: films.length },
      signal,
    });
    collection = toCollection(data.collection);
    if (!collection.films.length) break;
    films.push(...collection.films);
    total = data.total;
  }
  return { ...collection, films };
}
