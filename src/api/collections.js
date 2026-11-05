import { http } from '../utils/http.js';
import { toMovie } from './movies.js';

const normalize = (collection) => ({ ...collection, films: (collection.films || []).map(toMovie) });

export async function getCollections() {
  const collections = [];
  let total;
  do {
    const { ok, data } = await http.get('/api/collections', {
      params: { limit: 100, offset: collections.length },
    });
    if (!ok || !Array.isArray(data?.collections) || !Number.isInteger(data.total))
      throw new Error('Не удалось загрузить подборки');
    if (!data.collections.length && collections.length < data.total)
      throw new Error('Неполный список подборок');
    collections.push(...data.collections.map(normalize));
    total = data.total;
  } while (collections.length < total);
  return collections;
}

export async function getCollection(id) {
  const films = [];
  let collection;
  let total;
  do {
    const { ok, status, data } = await http.get(`/api/collections/${id}`, {
      params: { limit: 100, offset: films.length },
    });
    if (!ok || !Array.isArray(data?.collection?.films) || !Number.isInteger(data.total)) {
      throw new Error(status === 404 ? 'Подборка не найдена.' : 'Не удалось загрузить подборку.');
    }
    if (!data.collection.films.length && films.length < data.total)
      throw new Error('Неполный список фильмов');
    collection = data.collection;
    films.push(...data.collection.films.map(toMovie));
    total = data.total;
  } while (films.length < total);
  return { ...collection, films };
}
