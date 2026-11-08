import { requestPages } from './http.js';
import { getFilm, toFilm } from './films.js';

const toCollection = (collection) => ({
  id: collection.id,
  title: collection.title,
  description: collection.description || '',
});

export async function getCollections({ signal } = {}) {
  const pages = await requestPages('/collections', {
    signal,
    count: (data) => data.collections.length,
  });
  const ids = pages.flatMap((page) => page.collections.map((item) => item.id));
  return Promise.all(ids.map((id) => getCollection(id, { signal })));
}

export async function getCollection(id, { signal } = {}) {
  const pages = await requestPages(`/collections/${encodeURIComponent(id)}`, {
    params: { details: true },
    signal,
    count: (data) => data.collection.films?.length || 0,
  });
  const films = pages.flatMap((page) => (page.collection.films || []).map(toFilm));
  const missing = [...new Set(films.filter((film) => !film.description || !film.type || film.ageLimit === null).map((film) => film.id))];
  const details = new Map();
  for (let index = 0; index < missing.length; index += 6) {
    const batch = await Promise.all(missing.slice(index, index + 6).map(async (filmId) => {
      try {
        return [filmId, await getFilm(filmId, { signal })];
      } catch {
        return [filmId, null];
      }
    }));
    batch.forEach(([filmId, film]) => details.set(filmId, film));
  }
  return {
    ...toCollection(pages[0].collection),
    films: films.map((film) => ({ ...film, ...(details.get(film.id) || {}) })),
  };
}
