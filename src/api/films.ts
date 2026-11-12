import { assetUrl, request, requestPages } from './http.js';

export interface FilmResponse {
  id: number;
  title: string;
  original_title?: string;
  film_type: string;
  release_year: number;
  duration_min?: number;
  age_limit?: number;
  age_limit_unknown?: boolean;
  description?: string;
  poster_url?: string;
  trailer_url?: string;
  genres?: { name: string }[];
  seasons?: { episodes: number }[];
}

export type Film = ReturnType<typeof toFilm>;
type FilmList = { films: FilmResponse[]; total: number };

export const toFilm = (film: FilmResponse) => ({
  id: film.id,
  title: film.title,
  originalTitle: film.original_title || '',
  type: film.film_type,
  isSeries: film.film_type === 'series',
  year: film.release_year,
  duration: film.duration_min || null,
  ageLimit: film.age_limit_unknown || film.age_limit == null ? null : film.age_limit,
  description: film.description || '',
  poster: assetUrl(film.poster_url),
  trailer: film.trailer_url || '',
  genres: (film.genres || []).map((genre) => genre.name),
  seasons: film.seasons || [],
});

export async function getFilms({ signal }: { signal?: AbortSignal } = {}) {
  const pages = await requestPages<FilmList>('/films', {
    params: { details: true },
    signal,
    count: (data) => data.films.length,
  });
  return pages.flatMap((page) => page.films.map(toFilm));
}

export const getFilm = async (id: number | string, { signal }: { signal?: AbortSignal } = {}) =>
  toFilm((await request<{ film: FilmResponse }>(`/films/${encodeURIComponent(id)}`, { signal })).film);

export async function getFilmPosters(limit: number, { signal }: { signal?: AbortSignal } = {}) {
  const { films } = await request<FilmList>('/films', { params: { limit }, signal });
  return films
    .filter((film) => film.poster_url)
    .map((film) => ({
      title: film.title,
      poster: assetUrl(film.poster_url),
    }));
}
