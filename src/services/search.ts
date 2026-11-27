import type { Film } from '../api/films.js';
import { getPeople, type Person } from '../api/people.js';
import { loadCatalog } from './catalog.js';
import type { Library } from './library.js';

export const normalizeSearch = (value: string) =>
  value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
export const matchesFilm = (film: Film, query: string) =>
  normalizeSearch(`${film.title} ${film.originalTitle}`).includes(normalizeSearch(query));
export const matchesPerson = (person: Person, query: string) =>
  Boolean(query.trim()) &&
  normalizeSearch(`${person.name} ${person.originalName}`).includes(normalizeSearch(query));

let peopleCache: { at: number; people: Person[] } | null = null;

async function loadPeople(signal?: AbortSignal, fresh = false) {
  signal?.throwIfAborted();
  if (!fresh && peopleCache && Date.now() - peopleCache.at < 60_000) return peopleCache.people;
  const people = await getPeople({ signal });
  signal?.throwIfAborted();
  peopleCache = { at: Date.now(), people };
  return people;
}

/** Независимые ошибки источников не скрывают доступные фильмы или персон. */
export async function loadSearchData({
  signal,
  fresh = false,
}: { signal?: AbortSignal; fresh?: boolean } = {}) {
  const [films, people] = await Promise.allSettled([
    loadCatalog({ signal, fresh }),
    loadPeople(signal, fresh),
  ]);
  signal?.throwIfAborted();
  return {
    films: films.status === 'fulfilled' ? films.value : [],
    people: people.status === 'fulfilled' ? people.value : [],
    filmError: films.status === 'rejected',
    peopleError: people.status === 'rejected',
  };
}

export type SearchTab = 'all' | 'movie' | 'series' | 'people';
export const readSearchTab = (query: URLSearchParams): SearchTab => {
  const value = query.get('tab');
  return value === 'movie' || value === 'series' || value === 'people' ? value : 'all';
};

export type ListFilter = 'all' | 'hide' | 'only';
export type SearchLibraryFilters = Record<keyof Library, ListFilter>;
export const LIBRARY_PARAMS = {
  watched: 'inWatched',
  watchlater: 'inWatchlater',
  favorite: 'inFavorite',
} as const;

export function readSearchLibraryFilters(query: URLSearchParams): SearchLibraryFilters {
  const read = (name: string): ListFilter => {
    const value = query.get(name);
    return value === 'hide' || value === 'only' ? value : 'all';
  };
  return {
    watched: read(LIBRARY_PARAMS.watched),
    watchlater: read(LIBRARY_PARAMS.watchlater),
    favorite: read(LIBRARY_PARAMS.favorite),
  };
}

/** Личные списки сочетаются через AND; просмотренное не определяется по рейтингу. */
export function filterSearchLibrary(films: Film[], state: SearchLibraryFilters, library: Library) {
  const lists = Object.entries(state) as [keyof Library, ListFilter][];
  return films.filter((film) =>
    lists.every(
      ([list, mode]) =>
        mode === 'all' ||
        (mode === 'only' ? library[list].includes(film.id) : !library[list].includes(film.id)),
    ),
  );
}
