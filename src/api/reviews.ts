import { request, type RequestOptions } from './http.js';

const PAGE = 20;
const MAX_PAGES = 50;
export { getAudienceRating, getMyScore, setMyScore, deleteMyScore } from './ratings.js';

const filmReviews = (filmId: number) => `/films/${encodeURIComponent(filmId)}/reviews`;
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

export type Review = ReturnType<typeof toReview>;

const toReview = (item: ReviewResponse) => ({
  id: item.id,
  author: { id: item.author_id, name: item.author_username || `Пользователь #${item.author_id}` },
  score: item.author_score ?? null,
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

export async function getReviewsPage(filmId: number, offset = 0, options: RequestOptions = {}) {
  const data = await request<{ reviews: ReviewResponse[]; total: number }>(filmReviews(filmId), {
    ...options,
    params: { ...options.params, limit: PAGE, offset },
  });
  const nextOffset = offset + data.reviews.length;
  return {
    reviews: data.reviews.map(toReview),
    total: data.total,
    nextOffset,
    hasMore: data.reviews.length > 0 && nextOffset < data.total,
  };
}

export async function findMyReview(
  filmId: number,
  userId: number,
  options: RequestOptions = {},
  page = 0,
  offset = page * PAGE,
): Promise<Review | null> {
  const { reviews, hasMore, nextOffset } = await getReviewsPage(filmId, offset, options);
  const mine = reviews.find((item) => item.author.id === userId);
  if (mine) return mine;
  if (!hasMore) return null;
  if (page + 1 >= MAX_PAGES) throw new Error('Не удалось проверить все отзывы. Повторите позже.');
  return findMyReview(filmId, userId, options, page + 1, nextOffset);
}

/** Сохраняет id ответа POST; текущий API не возвращает дату создания и полную запись. */
export async function createReview(filmId: number, values: ReviewValues, authorId: number) {
  const data = await request<{ id: number; review?: ReviewResponse }>(filmReviews(filmId), {
    method: 'POST',
    body: toBody(values),
  });
  if (data.review) return toReview(data.review);
  if (!Number.isInteger(data.id) || data.id <= 0)
    throw new Error('Сервер не вернул идентификатор отзыва. Обновите страницу.');
  return toReview({
    ...toBody(values),
    id: data.id,
    author_id: authorId,
    version: 1,
    created_at: '',
  });
}

export async function updateReview(id: number, values: ReviewValues, version: number) {
  const data = await request<{ review: ReviewResponse }>(review(id), {
    method: 'PUT',
    body: { ...toBody(values), version },
  });
  return toReview(data.review);
}

export const deleteReview = (id: number) => request(review(id), { method: 'DELETE' });
