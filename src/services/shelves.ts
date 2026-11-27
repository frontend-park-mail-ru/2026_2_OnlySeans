import { store } from '../core/store.js';
import { readJson, writeJson, watchPreferences } from './storage.js';

export interface Shelf {
  id: string;
  name: string;
  filmIds: number[];
  createdAt: number;
}
export const SHELF_LIMIT = 50;
const key = () => `frame:shelves:${store.get('user')?.id ?? 'guest'}`;
const cleanName = (name: string) => name.trim().replace(/\s+/gu, ' ');
const nameKey = (name: string) => cleanName(name).toLocaleLowerCase('ru').replaceAll('ё', 'е');

/** Полки локальны и изолированы по аккаунтам; повреждённые записи не используются. */
export function readShelves(): Shelf[] {
  if (!store.get('user')) return [];
  const value = readJson<unknown>(key(), []);
  if (!Array.isArray(value)) return [];
  const result: Shelf[] = [];
  for (const item of value.slice(0, SHELF_LIMIT)) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      !/^[\w-]{1,64}$/.test(item.id) ||
      typeof item.name !== 'string' ||
      !cleanName(item.name) ||
      [...cleanName(item.name)].length > 40 ||
      !Array.isArray(item.filmIds) ||
      !Number.isFinite(item.createdAt) ||
      item.createdAt <= 0 ||
      result.some((shelf) => shelf.id === item.id || nameKey(shelf.name) === nameKey(item.name))
    )
      continue;
    const filmIds = [
      ...new Set(
        (item.filmIds as unknown[]).filter(
          (id: unknown): id is number =>
            typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
        ),
      ),
    ].slice(0, 2000);
    result.push({ id: item.id, name: cleanName(item.name), filmIds, createdAt: item.createdAt });
  }
  return result;
}

export function shelfNameError(name: string, currentId?: string) {
  const value = cleanName(name);
  if (!value) return 'Введите название полки';
  if ([...value].length > 40) return 'Название не должно быть длиннее 40 символов';
  if (
    readShelves().some((shelf) => shelf.id !== currentId && nameKey(shelf.name) === nameKey(value))
  )
    return 'Полка с таким названием уже есть';
  if (!currentId && readShelves().length >= SHELF_LIMIT) return 'Можно создать до 50 полок';
  return '';
}

function save(shelves: Shelf[]) {
  if (!store.get('user')) throw new Error('Войдите, чтобы создавать полки');
  if (!writeJson(key(), shelves))
    throw new Error('Не удалось сохранить полку на устройстве. Проверьте свободное место.');
}

export function saveShelf(name: string, id?: string): Shelf {
  const error = shelfNameError(name, id);
  if (error) throw new Error(error);
  const shelves = readShelves();
  const previous = id ? shelves.find((shelf) => shelf.id === id) : null;
  if (id && !previous) throw new Error('Полка больше не существует');
  const shelf: Shelf = previous
    ? { ...previous, name: cleanName(name) }
    : { id: crypto.randomUUID(), name: cleanName(name), filmIds: [], createdAt: Date.now() };
  save(previous ? shelves.map((item) => (item.id === id ? shelf : item)) : [...shelves, shelf]);
  return shelf;
}

export function deleteShelf(id: string) {
  save(readShelves().filter((shelf) => shelf.id !== id));
}

/** Одним сохранением обновляет выбранные полки для фильма. */
export function setFilmShelves(filmId: number, ids: string[]) {
  if (!Number.isSafeInteger(filmId) || filmId <= 0) throw new Error('Фильм недоступен');
  const selected = new Set(ids);
  const shelves = readShelves().map((shelf) => ({
    ...shelf,
    filmIds: selected.has(shelf.id)
      ? [...new Set([...shelf.filmIds, filmId])]
      : shelf.filmIds.filter((id) => id !== filmId),
  }));
  if (shelves.some((shelf) => shelf.filmIds.length > 2000))
    throw new Error('На одной полке может быть до 2000 фильмов');
  save(shelves);
}

export function shelfFilmIds(shelf: Shelf, favorites: number[]) {
  const saved = new Set(favorites);
  return shelf.filmIds.filter((id) => saved.has(id));
}

export function watchShelves(listener: () => void) {
  let previous = JSON.stringify(readShelves());
  const refresh = () => {
    const next = JSON.stringify(readShelves());
    if (next !== previous) {
      previous = next;
      listener();
    }
  };
  const unsubscribe = watchPreferences(refresh);
  const storage = (event: StorageEvent) => {
    if (event.key === key() || event.key === null) refresh();
  };
  window.addEventListener('storage', storage);
  return () => {
    unsubscribe();
    window.removeEventListener('storage', storage);
  };
}
