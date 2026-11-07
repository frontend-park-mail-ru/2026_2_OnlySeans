import { request } from './http.js';
import { getProfile } from './profile.js';

const ratingPath = (filmId) => '/films/' + encodeURIComponent(filmId) + '/rating';

export async function getAudienceRating(filmId) {
  const { rating } = await request(ratingPath(filmId));
  return { average: rating.average_score, count: rating.votes };
}

export async function getMyRating(filmId) {
  const { ratings } = await getProfile();
  const mine = ratings.find((film) => film.id === filmId);
  return mine ? { value: mine.score } : null;
}

export async function saveRating(filmId, score) {
  const { rating } = await request(ratingPath(filmId), { method: 'PUT', body: { score } });
  return { value: rating.score };
}

export const deleteRating = (filmId) =>
  request(ratingPath(filmId), { method: 'DELETE' });
