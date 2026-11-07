import { ApiError, request } from './http.js';

export async function fetchCurrentUser() {
  try {
    const data = await request('/authorised');
    return data.user || null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const login = async ({ email, password }) =>
  (await request('/login', { method: 'POST', body: { email, password } })).user;

export const register = async ({ email, username, password }) =>
  (await request('/register', { method: 'POST', body: { email, username, password } })).user;

export const logout = () => request('/logout', { method: 'POST' });
