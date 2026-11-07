import { assetUrl, request } from './http.js';

const PAGE_LIMIT = 100;

export const toFilm = (film) => ({
  id: film.id,
  title: film.title,
  originalTitle: film.original_title || '',
  type: film.film_type,
  isSeries: film.film_type === 'series',
  year: film.release_year,
  duration: film.duration_min || null,
  ageLimit: film.age_limit_unknown ? null : film.age_limit,
  description: film.description || '',
  poster: assetUrl(film.poster_url),
  trailer: film.trailer_url || '',
  genres: (film.genres || []).map((genre) => genre.name),
  seasons: film.seasons || [],
});

export async function getFilms({ signal } = {}) {
  const films = [];
  let total = Infinity;
  while (films.length < total) {
    const data = await request('/films', {
      params: { limit: PAGE_LIMIT, offset: films.length },
      signal,
    });
    if (!data.films.length) break;
    films.push(...data.films.map(toFilm));
    total = data.total;
  }
  return films;
}

export const getFilm = async (id, { signal } = {}) =>
  toFilm((await request(`/films/${encodeURIComponent(id)}`, { signal })).film);
