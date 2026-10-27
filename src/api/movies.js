import { API_BASE_URL, http } from '../utils/http.js';

const PAGE_SIZE = 100;

export function toMovie(film) {
  return {
    id: film.id,
    title: film.title,
    englishTitle: film.original_title || '',
    year: film.release_year,
    rating: Number.isFinite(film.rating) ? film.rating : null,
    type: film.film_type,
    durationMinutes: film.duration_min,
    genres: (film.genres || []).map((genre) => genre.name || genre.slug),
    description: film.description || '',
    poster: film.poster_url ? new URL(film.poster_url, API_BASE_URL).href : '',
  };
}

export async function getMovies(options = {}) {
  const movies = [];
  let offset = 0;
  let total;

  do {
    const { ok, status, data } = await http.get('/api/films', {
      signal: options.signal,
      params: { limit: PAGE_SIZE, offset },
    });

    if (!ok) {
      throw new Error(data?.error || `Failed to load films: HTTP ${status}`);
    }
    if (!Array.isArray(data?.films) || !Number.isInteger(data.total)) {
      throw new Error('Films API returned an invalid response');
    }

    movies.push(...data.films.map(toMovie));
    total = data.total;
    offset += data.films.length;

    if (data.films.length === 0 && offset < total) {
      throw new Error('Films API returned an incomplete page');
    }
  } while (offset < total);

  return movies;
}

export async function getMovie(filmId, options = {}) {
  const { ok, status, data } = await http.get(`/api/films/${encodeURIComponent(filmId)}`, options);
  if (!ok) throw Object.assign(new Error(data?.error || 'Не удалось загрузить фильм.'), { status });
  if (!data?.film || !Number.isSafeInteger(data.film.id)) throw new Error('Некорректный ответ каталога.');
  return toMovie(data.film);
}
