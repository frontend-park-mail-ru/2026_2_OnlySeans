import { readJson, writeJson } from './storage.js';

const HISTORY_KEY = 'frame:search-history';
const LIMIT = 8;

/** Возвращает только корректные строки из локальной истории поиска. */
export function searchHistory(): string[] {
  const history: unknown = readJson(HISTORY_KEY, []);
  return Array.isArray(history)
    ? history.filter((item): item is string => typeof item === 'string').slice(0, LIMIT)
    : [];
}

export function rememberSearch(query: string) {
  const value = query.trim();
  if (value)
    writeJson(
      HISTORY_KEY,
      [value, ...searchHistory().filter((item) => item !== value)].slice(0, LIMIT),
    );
}

export function clearSearchHistory() {
  writeJson(HISTORY_KEY, []);
}

export function removeSearchHistory(query: string) {
  writeJson(
    HISTORY_KEY,
    searchHistory().filter((item) => item !== query),
  );
}
