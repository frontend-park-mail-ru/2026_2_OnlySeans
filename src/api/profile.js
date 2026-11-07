import { request } from './http.js';

export const getProfile = () => request('/me/profile');

export const updateProfile = (username, email) =>
  request('/me/profile', { method: 'PUT', body: { username, email } });

export const changePassword = (current, next) =>
  request('/me/password', { method: 'PUT', body: { current_password: current, new_password: next } });

export const setFavorite = (filmId, saved) =>
  request('/me/favorites/' + encodeURIComponent(filmId), { method: saved ? 'PUT' : 'DELETE' });

export const getMyAvatar = () => request('/me/avatar');

export function uploadAvatar(file) {
  const body = new FormData();
  body.append('avatar', file);
  return request('/me/avatar', { method: 'PUT', body });
}
