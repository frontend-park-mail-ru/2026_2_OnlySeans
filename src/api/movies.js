import { API_BASE_URL, http } from '../utils/http.js';

const PAGE_SIZE = 100;

function toMovie(film) {
  return {
    id: film.id,
    title: film.title,
    englishTitle: film.original_title || '',
    year: film.release_year,
    rating: null,
    type: film.film_type,
    durationMinutes: film.duration_min,
    episodeMinutes: film.film_type === 'series' ? film.duration_min : null,
    genres: (film.genres || []).map((genre) => genre.name || genre.slug),
    description: film.description || '',
    directors: [],
    producers: [],
    poster: film.poster_url ? new URL(film.poster_url, API_BASE_URL).href : '',
  };
}

export async function getMovies() {
  const movies = [];
  let offset = 0;
  let total = 0;

  do {
    const { ok, status, data } = await http.get('/api/films', {
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
