import type { Film } from '../api/films.js';
import { findMyReview, type Review } from '../api/reviews.js';

export interface ProfileReview {
  film: Film;
  review: Review;
}
/** В текущем API отзывы доступны по фильмам; проверка ограничена четырьмя запросами одновременно. */
export async function loadProfileReviews(
  films: Film[],
  userId: number,
  expected: number,
  options: { signal: AbortSignal; onProgress?(checked: number): void },
) {
  const found: ProfileReview[] = [];
  let failed = 0;
  if (expected === 0) return { reviews: found, failed };
  for (let index = 0; index < films.length && found.length < expected; index += 4) {
    options.signal.throwIfAborted();
    const batch = await Promise.allSettled(
      films.slice(index, index + 4).map(async (film) => ({
        film,
        review: await findMyReview(film.id, userId, { signal: options.signal }),
      })),
    );
    options.signal.throwIfAborted();
    for (const result of batch) {
      if (result.status === 'rejected') failed++;
      else if (result.value.review)
        found.push({ film: result.value.film, review: result.value.review });
    }
    options.onProgress?.(Math.min(index + 4, films.length));
  }
  return {
    reviews: found.sort((a, b) => b.review.createdAt.localeCompare(a.review.createdAt)),
    failed,
  };
}
