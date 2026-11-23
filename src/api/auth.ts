import { ApiError, request } from './http.js';
import { HttpStatus } from './errors.js';
import type { Account } from '../services/offline-storage.js';

export async function fetchCurrentUser() {
  try {
    const data = await request<{ user?: Account }>('/authorised');
    return data.user || null;
  } catch (error) {
    if (error instanceof ApiError && error.status === HttpStatus.UNAUTHORIZED) return null;
    throw error;
  }
}

interface Credentials {
  email: string;
  password: string;
}

export const login = async ({ email, password }: Credentials) =>
  (await request<{ user: Account }>('/login', { method: 'POST', body: { email, password } })).user;

export const register = async ({ email, username, password }: Credentials & { username: string }) =>
  (await request<{ user: Account }>('/register', { method: 'POST', body: { email, username, password } })).user;

export const logout = () => request('/logout', { method: 'POST' });

export const updateProfile = async ({ email, username }: Pick<Account, 'email' | 'username'>) =>
  (await request<{ user: Account }>('/me', { method: 'PUT', body: { email, username } })).user;
