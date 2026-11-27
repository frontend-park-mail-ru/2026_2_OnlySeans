import { getFilms, type Film } from '../api/films.js';
import { visibleContent } from './content-preferences.js';
import { invalidateCatalogPager } from './catalog-pager.js';

const FRESH_MS = 60_000;
let cache: { at: number; films: Film[] } | null = null;
let revision = 0;

/** Сбрасывает публичные списки после изменения каталога администратором. */
export function invalidateCatalog() {
  cache = null;
  revision++;
  invalidateCatalogPager();
}

/** Кеширует завершённую загрузку; отмена одного потребителя не затрагивает другие запросы. */
export async function loadCatalog({
  fresh = false,
  signal,
}: { fresh?: boolean; signal?: AbortSignal } = {}) {
  signal?.throwIfAborted();
  if (!fresh && cache && Date.now() - cache.at <= FRESH_MS) return visibleContent(cache.films);
  const current = revision;
  const films = await getFilms({ signal });
  signal?.throwIfAborted();
  if (current === revision) cache = { at: Date.now(), films };
  return visibleContent(films);
}

export async function filmsByIds(ids: number[], options: Parameters<typeof loadCatalog>[0] = {}) {
  const byId = new Map((await loadCatalog(options)).map((film) => [film.id, film]));
  return ids.map((id) => byId.get(id)).filter((film): film is Film => film !== undefined);
}
