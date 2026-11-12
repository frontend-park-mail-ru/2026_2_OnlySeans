import { request, type RequestOptions } from './http.js';

const PAGE = 20;
const MAX_PAGES = 50;

const filmReviews = (filmId: number) => `/films/${encodeURIComponent(filmId)}/reviews`;
const filmRating = (filmId: number) => `/films/${encodeURIComponent(filmId)}/rating`;
const review = (id: number) => `/reviews/${encodeURIComponent(id)}`;

interface ReviewResponse {
  id: number;
  author_id: number;
  author_username?: string;
  author_score?: number;
  title: string;
  content: string;
  contains_spoilers: boolean;
  version: number;
  created_at: string;
}

type ReviewAuthors = Record<number, { name?: string; score?: number }>;
export type Review = ReturnType<typeof toReview>;

async function getReviewAuthors(): Promise<ReviewAuthors> {
  try {
    const response = await fetch('/review-authors.json', { cache: 'no-store' });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

const toReview = (item: ReviewResponse, authors: ReviewAuthors = {}) => ({
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

export interface ReviewValues {
  title: string;
  text: string;
  spoiler: boolean;
}

const toBody = ({ title, text, spoiler }: ReviewValues) => ({
  title,
  content: text,
  contains_spoilers: spoiler,
});

export async function getAudienceRating(filmId: number) {
  const { rating } = await request<{ rating: { average_score: number; votes: number } }>(filmRating(filmId));
  return { average: rating.average_score, count: rating.votes };
}

export async function getMyScore(filmId: number) {
  const { rating } = await request<{ rating: { score: number } | null }>(`${filmRating(filmId)}/me`);
  return rating?.score || 0;
}

export const setMyScore = (filmId: number, score: number) =>
  request(filmRating(filmId), { method: 'PUT', body: { score } });

export const deleteMyScore = (filmId: number) => request(filmRating(filmId), { method: 'DELETE' });

export async function getReviewsPage(filmId: number, offset = 0, options: RequestOptions = {}) {
  const [data, authors] = await Promise.all([
    request<{ reviews: ReviewResponse[]; total: number }>(filmReviews(filmId), { ...options, params: { limit: PAGE, offset } }),
    getReviewAuthors(),
  ]);
  const nextOffset = offset + PAGE;
  return {
    reviews: data.reviews.map((item) => toReview(item, authors)),
    nextOffset,
    hasMore: nextOffset < data.total,
  };
}

export async function findMyReview(filmId: number, userId: number, options: RequestOptions = {}, page = 0): Promise<Review | null> {
  const { reviews, hasMore } = await getReviewsPage(filmId, page * PAGE, options);
  const mine = reviews.find((item) => item.author.id === userId);
  if (mine) return mine;
  return hasMore && page + 1 < MAX_PAGES ? findMyReview(filmId, userId, options, page + 1) : null;
}

export const createReview = (filmId: number, values: ReviewValues) =>
  request(filmReviews(filmId), { method: 'POST', body: toBody(values) });

export async function updateReview(id: number, values: ReviewValues, version: number) {
  const data = await request<{ review: ReviewResponse }>(review(id), {
    method: 'PUT',
    body: { ...toBody(values), version },
  });
  return toReview(data.review);
}

export const deleteReview = (id: number) => request(review(id), { method: 'DELETE' });
