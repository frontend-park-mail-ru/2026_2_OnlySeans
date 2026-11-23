import { ApiError, request } from './http.js';
import { HttpStatus } from './errors.js';

export async function getAvatar() {
  try {
    return (await request<{ url: string }>('/me/avatar')).url;
  } catch (error) {
    if (error instanceof ApiError && error.status === HttpStatus.NOT_FOUND) return '';
    throw error;
  }
}

export function uploadAvatar(file) {
  const body = new FormData();
  body.append('avatar', file);
  return request('/me/avatar', { method: 'PUT', body });
}
