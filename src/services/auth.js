import { apiRequest } from '../api/auth.js';
import { eventBus, EVENTS } from '../modules/event-bus.js';

export async function logout() {
  const { ok } = await apiRequest('/api/logout', { method: 'POST' });
  if (!ok) return false;

  eventBus.emit(EVENTS.AUTH_LOGOUT);
  return true;
}
