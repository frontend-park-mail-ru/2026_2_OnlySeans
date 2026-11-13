import { requestPages } from './http.js';
import { getFilm, toFilm, type FilmResponse, type Film } from './films.js';

interface CollectionResponse {
  id: number;
  title: string;
  description?: string;
  films?: FilmResponse[];
}

type CollectionList = { collections: CollectionResponse[]; total: number };
type CollectionDetails = { collection: CollectionResponse; total: number };

const toCollection = (collection: CollectionResponse) => ({
  id: collection.id,
  title: collection.title,
  description: collection.description || '',
});

export async function getCollections({ signal }: { signal?: AbortSignal } = {}) {
  const pages = await requestPages<CollectionList>('/collections', {
    signal,
    count: (data) => data.collections.length,
  });
  const ids = pages.flatMap((page) => page.collections.map((item) => item.id));
  return Promise.all(ids.map((id) => getCollection(id, { signal })));
}

export async function getCollection(id: number | string, { signal }: { signal?: AbortSignal } = {}) {
  const pages = await requestPages<CollectionDetails>(`/collections/${encodeURIComponent(id)}`, {
    params: { details: true },
    signal,
    count: (data) => data.collection.films?.length || 0,
  });
  const films = pages.flatMap((page) => (page.collection.films || []).map(toFilm));
  const missing = [...new Set(
    films
      .filter((film) => !film.description || !film.type || film.ageLimit === null)
      .map((film) => film.id)
  )];
  const details = new Map<number, Film>();
  for (let index = 0; index < missing.length; index += 6) {
    const batch = await Promise.all(
      missing.slice(index, index + 6).map(async (filmId) => {
        try {
          return [filmId, await getFilm(filmId, { signal })] as const;
        } catch {
          return [filmId, null] as const;
        }
      })
    );
    batch.forEach(([filmId, film]) => details.set(filmId, film));
  }
  return {
    ...toCollection(pages[0].collection),
    films: films.map((film) => ({ ...film, ...(details.get(film.id) || {}) })),
  };
}
