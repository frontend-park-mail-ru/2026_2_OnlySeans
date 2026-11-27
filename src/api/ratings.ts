import { request } from './http.js';

const ratingPath = (filmId: number) => `/films/${encodeURIComponent(filmId)}/rating`;

/** Сводный рейтинг фильма из голосов зрителей. */
export async function getAudienceRating(filmId: number) {
  const { rating } = await request<{ rating: { average_score: number; votes: number } }>(
    ratingPath(filmId),
  );
  return { average: rating.average_score, count: rating.votes };
}

export async function getMyScore(filmId: number) {
  const { rating } = await request<{ rating: { score: number } | null }>(
    `${ratingPath(filmId)}/me`,
  );
  return rating?.score || 0;
}

export const setMyScore = (filmId: number, score: number) =>
  request(ratingPath(filmId), { method: 'PUT', body: { score } });

export const deleteMyScore = (filmId: number) => request(ratingPath(filmId), { method: 'DELETE' });
