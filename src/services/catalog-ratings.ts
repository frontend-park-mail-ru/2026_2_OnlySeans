import { request } from '../api/http.js';
import type { Film } from '../api/films.js';
import type { CatalogRating, CatalogRatings } from './catalog-filters.js';

const cache = new Map<number, { at: number; value: CatalogRating }>();
const FRESH_MS = 60_000;
const CONCURRENCY = 6;

/** Загружает сводные оценки через действующий API с ограничением числа запросов. */
export async function loadCatalogRatings(
  films: Film[],
  { signal }: { signal?: AbortSignal } = {},
): Promise<CatalogRatings> {
  const result: CatalogRatings = new Map();
  let next = 0;
  let failure: unknown;
  const worker = async () => {
    while (next < films.length && !failure) {
      signal?.throwIfAborted();
      const film = films[next++];
      try {
        const saved = cache.get(film.id);
        if (saved && Date.now() - saved.at < FRESH_MS) {
          result.set(film.id, saved.value);
          continue;
        }
        const data = await request<{ rating: { average_score: number; votes: number } }>(
          `/films/${film.id}/rating`,
          { signal },
        );
        const { average_score: average, votes } = data.rating || {};
        if (
          !Number.isFinite(average) ||
          average < 0 ||
          average > 10 ||
          !Number.isInteger(votes) ||
          votes < 0
        )
          throw new Error('Некорректный ответ рейтинга.');
        const value = { average, votes };
        cache.set(film.id, { at: Date.now(), value });
        result.set(film.id, value);
      } catch (error) {
        failure = error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, films.length) }, worker));
  if (failure) throw failure;
  return result;
}
