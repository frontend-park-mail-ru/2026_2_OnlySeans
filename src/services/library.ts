import { store } from '../core/store.js';
import { eventBus } from '../core/event-bus.js';
import { request } from '../api/http.js';

export const LISTS = ['favorite', 'watchlater', 'watched'] as const;
export type LibraryList = (typeof LISTS)[number];
export type Library = Record<LibraryList, number[]>;

const empty = (): Library => ({ favorite: [], watchlater: [], watched: [] });

let library = empty();
let owner: number | null = null;
let queue: Promise<unknown> = Promise.resolve();

const currentUserId = () => store.get('user')?.id ?? null;

function remember(data: Library, userId: number) {
  if (currentUserId() !== userId) return;
  owner = userId;
  library = { ...empty(), ...data };
  eventBus.emit('library:change', library);
}

function reset() {
  owner = null;
  library = empty();
  eventBus.emit('library:change', library);
}

export const readLibrary = () => (owner !== null && owner === currentUserId() ? library : empty());
export const libraryLoaded = () => owner !== null && owner === currentUserId();

export const isSaved = (list: LibraryList, filmId: number) => readLibrary()[list].includes(filmId);

export async function loadLibrary() {
  const userId = currentUserId();
  if (!userId) {
    reset();
    return;
  }
  await queue;
  remember(await request<Library>('/me/library'), userId);
}

function change(action: (userId: number) => Promise<void>) {
  const userId = currentUserId();
  if (!userId) return Promise.reject(new Error('Войдите, чтобы сохранять фильмы.'));
  const next = queue.then(() => {
    if (currentUserId() !== userId) throw new Error('Пользователь изменился. Повторите действие.');
    return action(userId);
  });
  queue = next.catch(() => {});
  return next;
}

export const toggleSaved = (list: LibraryList, filmId: number) =>
  change(async (userId) => {
    const data = await request<Library>(`/me/library/lists/${list}/${filmId}`, {
      method: 'PUT',
      body: { saved: !isSaved(list, filmId) },
    });
    remember(data, userId);
  });

export const watchLibrary = (handler: (library: Library) => void) =>
  eventBus.on('library:change', handler);

/** Переносит фильм через действующие операции списков; при сбое удаления сохраняет обе отметки. */
export const moveToWatched = (filmId: number) =>
  change(async (userId) => {
    const watched = await request<Library>(`/me/library/lists/watched/${filmId}`, {
      method: 'PUT',
      body: { saved: true },
    });
    remember(watched, userId);
    if (currentUserId() !== userId) throw new Error('Пользователь изменился. Повторите действие.');
    try {
      const updated = await request<Library>(`/me/library/lists/watchlater/${filmId}`, {
        method: 'PUT',
        body: { saved: false },
      });
      remember(updated, userId);
    } catch {
      throw new Error(
        'Фильм отмечен просмотренным, но остался в «Смотреть позже». Повторите перенос.',
      );
    }
  });

export const waitForFavorites = () => queue;
