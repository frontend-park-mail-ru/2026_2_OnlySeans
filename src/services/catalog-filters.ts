import type { Film } from '../api/films.js';

export type GenreSelection = -1 | 0 | 1;
export type CatalogSort = 'catalog' | 'popular' | 'rating' | 'newest' | 'title';
export interface CatalogFilters {
  genres: Record<string, GenreSelection>;
  genreLabels: Record<string, string>;
  anyGenre: boolean;
  allGenres: boolean;
  yearFrom: string;
  yearTo: string;
  ratingFrom: number;
  ages: number[];
  sort: CatalogSort;
}
export interface CatalogRating {
  average: number;
  votes: number;
}
export type CatalogRatings = Map<number, CatalogRating>;

export const CATALOG_SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'catalog', label: 'По умолчанию' },
  { value: 'popular', label: 'По популярности' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'newest', label: 'По дате выхода' },
  { value: 'title', label: 'По названию' },
];
export const CATALOG_AGES = [0, 6, 12, 16, 18];
const normalize = (value: string) => value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
const NON_FICTION = /документал|короткометраж|ток[- ]?шоу|реалити|тв[- ]?шоу/;

export function defaultCatalogFilters(): CatalogFilters {
  return {
    genres: {},
    genreLabels: {},
    anyGenre: false,
    allGenres: false,
    yearFrom: '',
    yearTo: '',
    ratingFrom: 0,
    ages: [],
    sort: 'catalog',
  };
}

/** Читает фильтры из URL; некорректные значения не попадают в состояние формы. */
export function readCatalogFilters(query: URLSearchParams): CatalogFilters {
  const state = defaultCatalogFilters();
  for (const [param, selection] of [
    ['neutralGenre', 0],
    ['excludeGenre', -1],
    ['genre', 1],
  ] as const) {
    query
      .getAll(param)
      .filter((value) => value.trim() && value.length <= 100)
      .forEach((value) => {
        state.genres[normalize(value)] = selection;
        state.genreLabels[normalize(value)] = value.trim();
      });
  }
  state.anyGenre = query.get('genreMode') === 'any';
  state.allGenres = query.get('allGenres') === '1';
  state.yearFrom = /^\d{4}$/.test(query.get('yearFrom') || '') ? query.get('yearFrom') || '' : '';
  state.yearTo = /^\d{4}$/.test(query.get('yearTo') || '') ? query.get('yearTo') || '' : '';
  if (catalogYearError(state)) {
    state.yearFrom = '';
    state.yearTo = '';
  }
  const rating = Number(query.get('ratingFrom'));
  state.ratingFrom = Number.isFinite(rating) && rating >= 0 && rating <= 10 ? rating : 0;
  state.ages = [
    ...new Set(
      query
        .getAll('age')
        .map(Number)
        .filter((age) => CATALOG_AGES.includes(age)),
    ),
  ];
  const sort = query.get('sort');
  if (CATALOG_SORTS.some((option) => option.value === sort)) state.sort = sort as CatalogSort;
  return state;
}

/** Сериализует состояние для прямых ссылок, перезагрузки и истории браузера. */
export function catalogQuery(state: CatalogFilters): URLSearchParams {
  const query = new URLSearchParams();
  Object.entries(state.genres)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, selection]) => {
      if (selection === 0 && (state.allGenres || !NON_FICTION.test(name))) return;
      query.append(
        selection === 1 ? 'genre' : selection === -1 ? 'excludeGenre' : 'neutralGenre',
        state.genreLabels[name] || name,
      );
    });
  if (state.anyGenre) query.set('genreMode', 'any');
  if (state.allGenres) query.set('allGenres', '1');
  if (state.yearFrom) query.set('yearFrom', state.yearFrom);
  if (state.yearTo) query.set('yearTo', state.yearTo);
  if (state.ratingFrom) query.set('ratingFrom', String(state.ratingFrom));
  state.ages.forEach((age) => query.append('age', String(age)));
  if (state.sort !== 'catalog') query.set('sort', state.sort);
  return query;
}

export function genreSelection(state: CatalogFilters, name: string): GenreSelection {
  const key = normalize(name);
  return Object.hasOwn(state.genres, key)
    ? state.genres[key]
    : !state.allGenres && NON_FICTION.test(key)
      ? -1
      : 0;
}

export function selectGenre(state: CatalogFilters, name: string, selection: GenreSelection) {
  state.genres[normalize(name)] = selection;
  state.genreLabels[normalize(name)] = name;
}

export function catalogYearError(state: Pick<CatalogFilters, 'yearFrom' | 'yearTo'>): string {
  if (
    [state.yearFrom, state.yearTo].some(
      (year) => year && (!/^\d{4}$/.test(year) || Number(year) < 1000),
    )
  )
    return 'Укажите год четырьмя цифрами.';
  if (state.yearFrom && state.yearTo && Number(state.yearFrom) > Number(state.yearTo))
    return 'Начальный год не может быть больше конечного.';
  return '';
}

export const needsCatalogRatings = (state: CatalogFilters) =>
  state.ratingFrom > 0 || ['rating', 'popular'].includes(state.sort);

/** Фильтрует загруженный каталог. Отсутствующий рейтинг не подменяется нулевой оценкой. */
export function filterCatalog(
  films: Film[],
  state: CatalogFilters,
  ratings: CatalogRatings = new Map(),
): Film[] {
  const included = Object.entries(state.genres)
    .filter(([, value]) => value === 1)
    .map(([name]) => name);
  const result = films.filter((film) => {
    const genres = film.genres.map(normalize);
    if (genres.some((genre) => genreSelection(state, genre) === -1)) return false;
    if (
      included.length &&
      !(state.anyGenre
        ? included.some((name) => genres.includes(name))
        : included.every((name) => genres.includes(name)))
    )
      return false;
    if (state.yearFrom && film.year < Number(state.yearFrom)) return false;
    if (state.yearTo && film.year > Number(state.yearTo)) return false;
    if (state.ages.length && film.ageLimit !== null && !state.ages.includes(film.ageLimit))
      return false;
    const rating = ratings.get(film.id);
    return !state.ratingFrom || Boolean(rating?.votes && rating.average >= state.ratingFrom);
  });
  if (state.sort !== 'catalog')
    result.sort((a, b) => {
      if (state.sort === 'title') return a.title.localeCompare(b.title, 'ru') || a.id - b.id;
      if (state.sort === 'newest') return b.year - a.year || a.id - b.id;
      const first = ratings.get(a.id);
      const second = ratings.get(b.id);
      const score = (rating: CatalogRating | undefined) =>
        rating && rating.votes > 0 ? rating.average : -1;
      return (
        (state.sort === 'popular'
          ? (second?.votes || 0) - (first?.votes || 0)
          : score(second) - score(first)) || a.id - b.id
      );
    });
  return result;
}

export function catalogFilterCount(state: CatalogFilters): number {
  return (
    Object.entries(state.genres).filter(
      ([name, selection]) => selection !== 0 || (!state.allGenres && NON_FICTION.test(name)),
    ).length +
    Number(state.allGenres) +
    Number(Boolean(state.yearFrom || state.yearTo)) +
    Number(state.ratingFrom > 0) +
    Number(state.ages.length > 0)
  );
}

export function catalogFilterTags(state: CatalogFilters, genres: string[] = []) {
  const labels = new Map(genres.map((name) => [normalize(name), name]));
  const tags = Object.entries(state.genres)
    .filter(([name, selection]) => selection !== 0 || (!state.allGenres && NON_FICTION.test(name)))
    .map(([name, selection]) => ({
      key: `genre:${name}`,
      label: `${selection === -1 ? '⦸' : selection === 1 ? '+' : 'Без исключения:'} ${labels.get(name) || state.genreLabels[name] || name}`,
      excluded: selection === -1,
    }));
  if (state.allGenres) tags.push({ key: 'artistic', label: 'Все жанры', excluded: false });
  if (state.yearFrom || state.yearTo)
    tags.push({
      key: 'year',
      label: `${state.yearFrom || '…'}–${state.yearTo || '…'}`,
      excluded: false,
    });
  if (state.ratingFrom)
    tags.push({
      key: 'rating',
      label: `от ${state.ratingFrom.toLocaleString('ru')}`,
      excluded: false,
    });
  state.ages.forEach((age) => tags.push({ key: `age:${age}`, label: `${age}+`, excluded: false }));
  return tags;
}
