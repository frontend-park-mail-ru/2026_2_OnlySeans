import type { Film } from '../api/films.js';
import type { CatalogRatings } from './catalog-filters.js';

export type FavoriteSort = 'recent' | 'rating' | 'year' | 'title' | 'unwatched';
export const FAVORITE_SORTS: { value: FavoriteSort; label: string }[] = [
  { value: 'recent', label: 'Порядок списка' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'year', label: 'По году выхода' },
  { value: 'title', label: 'По названию' },
  { value: 'unwatched', label: 'Сначала непросмотренные' },
];

/** Порядок recent приходит из API; даты добавления не восстанавливаются по нему. */
export function sortFavorites(
  films: Film[],
  sort: FavoriteSort,
  ratings: CatalogRatings,
  watched: number[],
) {
  const result = [...films];
  const seen = new Set(watched);
  if (sort === 'recent') return result;
  const order = new Map(films.map((film, index) => [film.id, index]));
  return result.sort((a, b) => {
    let difference = 0;
    if (sort === 'title') difference = a.title.localeCompare(b.title, 'ru');
    if (sort === 'year') difference = b.year - a.year;
    if (sort === 'unwatched') difference = Number(seen.has(a.id)) - Number(seen.has(b.id));
    if (sort === 'rating') {
      const score = (id: number) => {
        const rating = ratings.get(id);
        return rating?.votes ? rating.average : -1;
      };
      difference = score(b.id) - score(a.id);
    }
    return difference || order.get(a.id)! - order.get(b.id)!;
  });
}

export function favoriteStats(films: Film[]) {
  const genres = new Map<string, number>();
  films.forEach((film) =>
    film.genres.forEach((genre) => genres.set(genre, (genres.get(genre) || 0) + 1)),
  );
  const ranked = [...genres].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'));
  const known = films.filter(
    (film) =>
      !film.isSeries &&
      film.duration !== null &&
      Number.isFinite(film.duration) &&
      film.duration > 0,
  );
  return {
    total: films.length,
    movies: films.filter((film) => !film.isSeries).length,
    series: films.filter((film) => film.isSeries).length,
    hours: known.length
      ? Math.round((known.reduce((sum, film) => sum + film.duration!, 0) / 60) * 10) / 10
      : null,
    genre: ranked[0]?.[0] ?? '',
    genres: ranked.map(([name]) => name),
  };
}

export function similarFavorites(catalog: Film[], favorites: Film[], watched: number[]) {
  const excluded = new Set([...favorites.map((film) => film.id), ...watched]);
  const genres = new Map<string, number>();
  favorites.forEach((film) =>
    film.genres.forEach((genre) => genres.set(genre, (genres.get(genre) || 0) + 1)),
  );
  return catalog
    .filter((film) => !excluded.has(film.id))
    .map((film) => ({
      film,
      score: film.genres.reduce((sum, genre) => sum + (genres.get(genre) || 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.film.id - b.film.id)
    .map((item) => item.film);
}

export function parseFavoriteShare(query: URLSearchParams): number[] | null {
  if (!query.has('shared')) return null;
  const raw = query.get('shared') || '';
  if (raw.length > 1800 || !/^\d+(,\d+)*$/.test(raw))
    throw new Error('Ссылка на список повреждена');
  const ids = raw.split(',').map(Number);
  if (ids.length > 100 || ids.some((id) => !Number.isSafeInteger(id) || id <= 0))
    throw new Error('Ссылка на список повреждена');
  return [...new Set(ids)];
}

export function favoriteShare(ids: number[]) {
  if (!ids.length) throw new Error('В списке нет фильмов для ссылки');
  if (ids.length > 100)
    throw new Error('В ссылку можно включить до 100 фильмов. Выберите полку или уточните поиск.');
  const url = new URL('/favorites', location.origin);
  url.searchParams.set('shared', ids.join(','));
  return url.href;
}
