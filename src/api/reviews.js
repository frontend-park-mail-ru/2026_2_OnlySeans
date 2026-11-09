import { request } from './http.js';

const PAGE = 20;
const MAX_PAGES = 50;

const filmReviews = (filmId) => `/films/${encodeURIComponent(filmId)}/reviews`;
const filmRating = (filmId) => `/films/${encodeURIComponent(filmId)}/rating`;
const review = (id) => `/reviews/${encodeURIComponent(id)}`;

async function getReviewAuthors() {
  try {
    const response = await fetch('/review-authors.json', { cache: 'no-store' });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

const toReview = (item, authors = {}) => ({
  id: item.id,
  author: { id: item.author_id, name: item.author_username || authors[item.id]?.name || 'Пользователь' },
  score: item.author_score ?? authors[item.id]?.score ?? null,
  title: item.title,
  text: item.content,
  spoiler: Boolean(item.contains_spoilers),
  version: item.version,
  createdAt: item.created_at,
  edited: item.version > 1,
});

const toBody = ({ title, text, spoiler }) => ({
  title,
  content: text,
  contains_spoilers: spoiler,
});

export async function getAudienceRating(filmId) {
  const { rating } = await request(filmRating(filmId));
  return { average: rating.average_score, count: rating.votes };
}

export async function getMyScore(filmId) {
  const { rating } = await request(`${filmRating(filmId)}/me`);
  return rating?.score || 0;
}

export const setMyScore = (filmId, score) =>
  request(filmRating(filmId), { method: 'PUT', body: { score } });

export const deleteMyScore = (filmId) => request(filmRating(filmId), { method: 'DELETE' });

export async function getReviewsPage(filmId, offset = 0) {
  const [data, authors] = await Promise.all([
    request(filmReviews(filmId), { params: { limit: PAGE, offset } }),
    getReviewAuthors(),
  ]);
  const nextOffset = offset + PAGE;
  return {
    reviews: data.reviews.map((item) => toReview(item, authors)),
    nextOffset,
    hasMore: nextOffset < data.total,
  };
}

export async function findMyReview(filmId, userId, page = 0) {
  const { reviews, hasMore } = await getReviewsPage(filmId, page * PAGE);
  const mine = reviews.find((item) => item.author.id === userId);
  if (mine) return mine;
  return hasMore && page + 1 < MAX_PAGES ? findMyReview(filmId, userId, page + 1) : null;
}

export const createReview = (filmId, values) =>
  request(filmReviews(filmId), { method: 'POST', body: toBody(values) });

export async function updateReview(id, values, version) {
  const data = await request(review(id), {
    method: 'PUT',
    body: { ...toBody(values), version },
  });
  return toReview(data.review);
}

export const deleteReview = (id) => request(review(id), { method: 'DELETE' });
