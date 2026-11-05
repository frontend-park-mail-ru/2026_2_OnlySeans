import { apiRequest } from '../api/auth.js';
import { store } from '../modules/store.js';

export async function logout() {
  const { ok } = await apiRequest('/api/logout', { method: 'POST' });
  if (!ok) return false;

  store.setState({ user: null });
  return true;
}
