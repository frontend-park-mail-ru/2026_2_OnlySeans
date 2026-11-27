import { readJson, writeJson, StorageKey } from './storage.js';
import { CATALOG_SORTS, type CatalogSort } from './catalog-filters.js';
import type { Film } from '../api/films.js';

const KEY = 'frame:content';
export interface ContentPreferences {
  hideSpoilers: boolean;
  hideAdults: boolean;
  hideWatchedRecommendations: boolean;
  titles: 'russian' | 'original' | 'both';
  sort: CatalogSort;
}

/** Нормализует настройки отображения, сохранённые на устройстве. */
export function readContentPreferences(): ContentPreferences {
  const raw = readJson<unknown>(KEY, null);
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    hideSpoilers: value.hideSpoilers !== false,
    hideAdults: value.hideAdults === true,
    hideWatchedRecommendations: value.hideWatchedRecommendations !== false,
    titles: value.titles === 'original' || value.titles === 'both' ? value.titles : 'russian',
    sort: CATALOG_SORTS.find((sort) => sort.value === value.sort)?.value ?? 'catalog',
  };
}

export function saveContentPreferences(patch: Partial<ContentPreferences>) {
  return writeJson(KEY, { ...readContentPreferences(), ...patch });
}

export function readCatalogView() {
  return readJson<unknown>(StorageKey.CATALOG_VIEW, 'grid') === 'list' ? 'list' : 'grid';
}

export function visibleContent(films: Film[]) {
  return readContentPreferences().hideAdults
    ? films.filter((film) => film.ageLimit === null || film.ageLimit < 18)
    : films;
}
