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
    ageLimit: film.age_limit,
    trailer: film.trailer_url || '',
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

function toCollection(collection) {
  return {
    id: collection.id,
    title: collection.title,
    description: collection.description || '',
    movies: (collection.films || []).map(toMovie),
  };
}

async function load(endpoint, params) {
  const { ok, status, data } = await http.get(endpoint, { params });

  if (!ok) {
    throw new Error(data?.error || `Request failed: HTTP ${status}`);
  }

  return data;
}

export async function getMovie(id) {
  const data = await load(`/api/films/${id}`);
  return toMovie(data.film);
}

export async function getCollections() {
  const data = await load('/api/collections', { limit: PAGE_SIZE });
  return data.collections.map(toCollection);
}

export async function getCollection(id) {
  const data = await load(`/api/collections/${id}`, { limit: PAGE_SIZE });
  return toCollection(data.collection);
}
