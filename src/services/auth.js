import { apiRequest } from '../api/auth.js';
import { eventBus, EVENTS } from '../modules/event-bus.js';
import { store } from '../modules/store.js';

export async function logout() {
  const { ok } = await apiRequest('/api/logout', { method: 'POST' });
  if (!ok) return false;

  store.setState({ user: null });
  eventBus.emit(EVENTS.AUTH_LOGOUT);
  return true;
}
