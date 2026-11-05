import { franchises } from '../data/franchises.js';

const normalize = (value) =>
  String(value || '')
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‐-―]/g, '-')
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .trim();

const entryIndex = new Map();
for (const franchise of franchises) {
  for (const [index, entry] of franchise.entries.entries())
    entryIndex.set(`${franchise.id}:${entry.key}`, { franchise, entry, index });
}
const lookup = (franchise, key) => entryIndex.get(`${franchise.id}:${key}`)?.entry || null;

/** Находит фильм каталога для записи франшизы: по оригинальному названию и году (допуск ±1 из-за разных дат премьер). */
export const matchCatalog = (movies) => {
  const byTitle = new Map();
  for (const movie of movies) {
    for (const title of [movie.englishTitle, movie.title]) {
      const key = normalize(title);
      if (!key) continue;
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key).push(movie);
    }
  }
  const entryToMovie = new Map();
  const movieToEntry = new Map();
  for (const franchise of franchises) {
    for (const entry of franchise.entries) {
      const candidates = [
        ...(byTitle.get(normalize(entry.original)) || []),
        ...(byTitle.get(normalize(entry.title)) || []),
      ];
      const movie = candidates.find((item) => Math.abs(item.year - entry.year) <= 1);
      if (!movie || movieToEntry.has(movie.id)) continue;
      entryToMovie.set(`${franchise.id}:${entry.key}`, movie);
      movieToEntry.set(movie.id, { franchise, entry });
    }
  }
  return {
    movieFor: (franchise, entry) => entryToMovie.get(`${franchise.id}:${entry.key}`) || null,
    entryFor: (movie) => movieToEntry.get(movie.id) || null,
  };
};

const releaseSort = (franchise) => (a, b) =>
  a.year - b.year ||
  entryIndex.get(`${franchise.id}:${a.key}`).index -
    entryIndex.get(`${franchise.id}:${b.key}`).index;

/** Все обязательные предшественники записи (транзитивно), без неё самой. */
export const requiredBefore = (franchise, key) => {
  const result = new Set();
  const visit = (current) => {
    for (const dependency of lookup(franchise, current)?.needs || []) {
      if (result.has(dependency)) continue;
      result.add(dependency);
      visit(dependency);
    }
  };
  visit(key);
  return [...result]
    .map((item) => lookup(franchise, item))
    .filter(Boolean)
    .sort(releaseSort(franchise));
};

/** Желательные, но не обязательные части для пути к цели. */
export const recommendedBefore = (franchise, key) => {
  const required = new Set(requiredBefore(franchise, key).map((entry) => entry.key));
  required.add(key);
  const result = new Set();
  for (const item of required)
    for (const recommendation of lookup(franchise, item)?.recommends || [])
      if (!required.has(recommendation)) result.add(recommendation);
  return [...result]
    .map((item) => lookup(franchise, item))
    .filter(Boolean)
    .sort(releaseSort(franchise));
};

export const entryMinutes = (entry) =>
  entry.minutes ||
  (entry.episodes && entry.episodeMinutes ? entry.episodes * entry.episodeMinutes : 0);

export const formatDuration = (minutes) => {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} ч${rest ? ` ${rest} мин` : ''}` : `${rest} мин`;
};

/**
 * Вердикт «можно ли смотреть без предыдущих частей».
 * kind: first — начало франшизы, standalone — самостоятельная часть,
 * recommended — можно, но лучше знать предысторию, required — без предыдущих частей нельзя.
 */
export const getSequelVerdict = (franchise, entry) => {
  const earlier = franchise.entries.filter(
    (item) =>
      item.year < entry.year ||
      (item.year === entry.year &&
        entryIndex.get(`${franchise.id}:${item.key}`).index <
          entryIndex.get(`${franchise.id}:${entry.key}`).index),
  );
  const required = requiredBefore(franchise, entry.key);
  const recommended = recommendedBefore(franchise, entry.key);
  if (required.length)
    return {
      kind: 'required',
      label: 'Нет, сначала посмотрите предыдущие части',
      required,
      recommended,
    };
  if (recommended.length)
    return {
      kind: 'recommended',
      label: 'Можно, но лучше знать предысторию',
      required,
      recommended,
    };
  if (!earlier.length)
    return { kind: 'first', label: 'Да — это первая часть', required, recommended };
  return { kind: 'standalone', label: 'Да, история самостоятельная', required, recommended };
};

/** Место части в порядке выхода: «часть N из M», предыдущая и следующая. */
export const franchisePosition = (franchise, entry) => {
  const ordered = [...franchise.entries].sort(releaseSort(franchise));
  const index = ordered.findIndex((item) => item.key === entry.key);
  return {
    number: index + 1,
    total: ordered.length,
    previous: ordered[index - 1] || null,
    next: ordered[index + 1] || null,
  };
};
