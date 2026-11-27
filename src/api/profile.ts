import { request } from './http.js';
import type { Account } from '../services/offline-storage.js';

export interface ProfileFilm {
  id: number;
  title: string;
  year: number;
  type: string;
  age_limit: number;
  genres: string;
  poster: string | null;
  average: number;
  score?: number;
}

export interface Profile {
  user: Account & { created_at: string };
  favorites: ProfileFilm[];
  ratings: ProfileFilm[];
  reviews: number;
}

/** Профиль текущей cookie-сессии вместе с личными списками и оценками. */
export const getProfile = () => request<Profile>('/me/profile');

export const updateProfile = (username: string, email: string) =>
  request<{ user: Account }>('/me/profile', { method: 'PUT', body: { username, email } });

export const changePassword = (current: string, next: string) =>
  request('/me/password', {
    method: 'PUT',
    body: { current_password: current, new_password: next },
  });

export const setFavorite = (filmId: number, saved: boolean) =>
  request('/me/favorites/' + encodeURIComponent(filmId), { method: saved ? 'PUT' : 'DELETE' });

export const getMyAvatar = () => request<{ url: string }>('/me/avatar');
export const deleteMyAvatar = () => request('/me/avatar', { method: 'DELETE' });

/** Отправляет подготовленное изображение одним multipart-полем avatar. */
export function uploadAvatar(file: File) {
  const body = new FormData();
  body.append('avatar', file);
  return request('/me/avatar', { method: 'PUT', body });
}
