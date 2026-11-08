import { ApiError, request } from './http.js';
import { HttpStatus } from './errors.js';

export async function fetchCurrentUser() {
  try {
    const data = await request('/authorised');
    return data.user || null;
  } catch (error) {
    if (error instanceof ApiError && error.status === HttpStatus.UNAUTHORIZED) return null;
    throw error;
  }
}

export const login = async ({ email, password }) =>
  (await request('/login', { method: 'POST', body: { email, password } })).user;

export const register = async ({ email, username, password }) =>
  (await request('/register', { method: 'POST', body: { email, username, password } })).user;

export const logout = () => request('/logout', { method: 'POST' });

export const updateProfile = async ({ email, username }) =>
  (await request('/me', { method: 'PUT', body: { email, username } })).user;
