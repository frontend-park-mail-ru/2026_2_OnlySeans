import { assetUrl, request, requestPages } from './http.js';

export const toFilm = (film) => ({
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

export async function getFilms({ signal } = {}) {
  const pages = await requestPages('/films', {
    params: { details: true },
    signal,
    count: (data) => data.films.length,
  });
  return pages.flatMap((page) => page.films.map(toFilm));
}

export const getFilm = async (id, { signal } = {}) =>
  toFilm((await request(`/films/${encodeURIComponent(id)}`, { signal })).film);

export async function getFilmPosters(limit, { signal } = {}) {
  const { films } = await request('/films', { params: { limit }, signal });
  return films
    .filter((film) => film.poster_url)
    .map((film) => ({
      title: film.title,
      poster: assetUrl(film.poster_url),
    }));
}
