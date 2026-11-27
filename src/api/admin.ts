import { ApiError, request } from './http.js';
import { toFilm, type FilmResponse } from './films.js';

/** Административные чтения обходят офлайн-кеш и пользовательские ограничения каталога. */
export async function getAdminFilms(offset: number, signal?: AbortSignal) {
  const data = await request<{ films: FilmResponse[]; total: number }>('/films', {
    params: { details: true, limit: 20, offset },
    signal,
    fresh: true,
  });
  if (!Array.isArray(data.films) || !Number.isSafeInteger(data.total) || data.total < 0)
    throw new Error('Некорректный ответ каталога');
  return { films: data.films.map(toFilm), total: data.total };
}

export async function getAdminFilm(id: number, signal?: AbortSignal) {
  const data = await request<{ film: FilmResponse }>(`/films/${id}`, { signal, fresh: true });
  return toFilm(data.film);
}

/** Поля, принимаемые CreateFilm и UpdateFilm сервиса каталога. */
export interface FilmInput {
  title: string;
  original_title: string | null;
  film_type: 'movie' | 'series';
  release_year: number;
  duration_min: number | null;
  age_limit: number;
  description: string | null;
}

/** Создание возвращает только ID; постер загружается отдельным запросом. */
export async function createFilm(body: FilmInput): Promise<number> {
  const data = await request<{ id: number }>('/films', { method: 'POST', body });
  if (!Number.isSafeInteger(data.id) || data.id <= 0)
    throw new Error('Сервер не вернул ID созданного фильма. Проверьте каталог перед повтором.');
  return data.id;
}

export const updateFilm = (id: number, body: FilmInput) =>
  request(`/films/${id}`, { method: 'PUT', body });

export const deleteFilm = (id: number) => request(`/films/${id}`, { method: 'DELETE' });

/** FormData передаётся без Content-Type, чтобы браузер сформировал multipart boundary. */
export function uploadPoster(id: number, file: File) {
  const body = new FormData();
  body.append('poster', file);
  return request<{ filename: string }>(`/films/${id}/poster`, { method: 'POST', body });
}

export const deletePoster = (id: number) => request(`/films/${id}/poster`, { method: 'DELETE' });

export function adminError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Сессия завершена. Войдите снова, затем повторите действие.';
    if (error.status === 403) return 'Нет доступа. Изменять фильмы может только администратор.';
    if (error.status === 404) return 'Фильм не найден. Возможно, его уже удалили.';
    if (error.status === 413) return 'Файл слишком большой. Выберите постер до 5 МБ.';
    if (error.status === 400) return 'Сервер отклонил данные. Проверьте поля и формат постера.';
  }
  return 'Не удалось выполнить запрос. Проверьте подключение и повторите действие.';
}
