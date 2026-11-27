import { requestPages } from './http.js';
import { toFilm, type FilmResponse } from './films.js';

export type ReleaseRegion = 'world' | 'russia';

export interface ReleaseResponse {
  film_id: number;
  world_premiere_date: string | null;
  russia_premiere_date: string | null;
  film: FilmResponse;
}

type ReleasePage = { items: ReleaseResponse[]; total: number };

export async function getReleases(
  from: string,
  to: string,
  region: ReleaseRegion,
  { signal }: { signal?: AbortSignal } = {},
) {
  const pages = await requestPages<ReleasePage>('/releases', {
    params: { from, to, region },
    signal,
    count: (page) => {
      if (!Array.isArray(page.items) || !Number.isSafeInteger(page.total) || page.total < 0)
        throw new Error('Invalid release calendar response');
      return page.items.length;
    },
  });
  return pages.flatMap((page) =>
    page.items.flatMap((release) => {
      const date = region === 'world' ? release.world_premiere_date : release.russia_premiere_date;
      return date ? [{ date, film: toFilm(release.film) }] : [];
    }),
  );
}
