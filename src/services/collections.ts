import { store } from '../core/store.js';
import { readJson, writeJson } from './storage.js';
import type { Film } from '../api/films.js';
import { parseFavoriteShare, favoriteStats } from './favorites.js';

export interface LocalCollection {
  id: string;
  title: string;
  description: string;
  filmIds: number[];
  createdAt: number;
}
export interface Collection {
  id: string | number;
  title: string;
  description: string;
  films: Film[];
  local?: boolean;
  createdAt?: number;
}
const key = (suffix: string) => `frame:collections:${store.get('user')?.id ?? 'guest'}:${suffix}`;
const ids = (value: unknown): number[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
          ),
        ),
      ].slice(0, 100)
    : [];

/** Пользовательские подборки остаются на устройстве: API создания и публикации пока нет. */
export function readLocalCollections(): LocalCollection[] {
  if (!store.get('user')) return [];
  const raw = readJson<unknown>(key('own'), []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is LocalCollection =>
      Boolean(
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        /^local-[\w-]{1,64}$/.test(item.id) &&
        typeof item.title === 'string' &&
        item.title.trim() &&
        [...item.title].length <= 80 &&
        typeof item.description === 'string' &&
        [...item.description].length <= 500 &&
        Number.isFinite(item.createdAt) &&
        item.createdAt > 0,
      ),
    )
    .slice(0, 50)
    .map((item) => ({ ...item, filmIds: ids(item.filmIds) }));
}
export function collectionError(title: string, description: string, filmIds: number[]) {
  if (!title.trim()) return 'Введите название подборки';
  if ([...title.trim()].length > 80) return 'Название должно быть не длиннее 80 символов';
  if ([...description].length > 500) return 'Описание должно быть не длиннее 500 символов';
  if (!ids(filmIds).length) return 'Выберите хотя бы один фильм';
  if (filmIds.length > 100) return 'В подборке может быть до 100 фильмов';
  return '';
}
function save(value: LocalCollection[]) {
  if (!store.get('user')) throw new Error('Войдите, чтобы создавать подборки');
  if (!writeJson(key('own'), value)) throw new Error('Не удалось сохранить подборку на устройстве');
}
export function saveLocalCollection(
  title: string,
  description: string,
  filmIds: number[],
  id?: string,
) {
  const error = collectionError(title, description, filmIds);
  if (error) throw new Error(error);
  const previous = readLocalCollections();
  const old = id ? previous.find((item) => item.id === id) : null;
  if (id && !old) throw new Error('Подборка больше не существует');
  if (!old && previous.length >= 50) throw new Error('Можно создать до 50 подборок');
  const value: LocalCollection = {
    id: old?.id ?? `local-${crypto.randomUUID()}`,
    title: title.trim(),
    description: description.trim(),
    filmIds: ids(filmIds),
    createdAt: old?.createdAt ?? Date.now(),
  };
  save(old ? previous.map((item) => (item.id === id ? value : item)) : [value, ...previous]);
  return value;
}
export function deleteLocalCollection(id: string) {
  save(readLocalCollections().filter((item) => item.id !== id));
}
export function resolveLocalCollections(catalog: Film[]): Collection[] {
  const byId = new Map(catalog.map((film) => [film.id, film]));
  return readLocalCollections().map((item) => ({
    ...item,
    local: true,
    films: item.filmIds.map((id) => byId.get(id)).filter((film): film is Film => Boolean(film)),
  }));
}
export function savedCollections(): string[] {
  if (!store.get('user')) return [];
  const raw = readJson<unknown>(key('saved'), []);
  return Array.isArray(raw)
    ? [
        ...new Set(
          raw.filter(
            (id): id is string => typeof id === 'string' && /^(\d+|local-[\w-]+)$/.test(id),
          ),
        ),
      ].slice(0, 200)
    : [];
}
export function toggleCollection(id: string | number) {
  if (!store.get('user')) throw new Error('Войдите, чтобы сохранять подборки');
  const previous = savedCollections();
  const value = String(id);
  if (!previous.includes(value) && previous.length >= 200)
    throw new Error('Можно сохранить до 200 подборок');
  if (
    !writeJson(
      key('saved'),
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    )
  )
    throw new Error('Не удалось сохранить подборку на устройстве');
}
export function collectionShare(collection: Collection) {
  const url = new URL('/collections/snapshot', location.origin);
  if (!collection.films.length || collection.films.length > 100)
    throw new Error('Для ссылки нужно от 1 до 100 фильмов');
  url.searchParams.set('shared', collection.films.map((film) => film.id).join(','));
  url.searchParams.set('title', collection.title);
  if (collection.description)
    url.searchParams.set('description', collection.description.slice(0, 500));
  return url.href;
}
export function readCollectionSnapshot(query: URLSearchParams, catalog: Film[]): Collection {
  const filmIds = parseFavoriteShare(query);
  if (!filmIds) throw new Error('Ссылка на подборку повреждена');
  const title = (query.get('title') || 'Подборка по ссылке').slice(0, 80);
  const byId = new Map(catalog.map((film) => [film.id, film]));
  return {
    id: 'snapshot',
    title,
    description: (query.get('description') || '').slice(0, 500),
    films: filmIds.map((id) => byId.get(id)).filter((film): film is Film => Boolean(film)),
  };
}
export const collectionHours = (collection: Collection) =>
  favoriteStats(collection.films).hours?.toLocaleString('ru') ?? '—';
