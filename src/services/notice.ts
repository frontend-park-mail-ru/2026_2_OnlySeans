import { eventBus } from '../core/event-bus.js';

export const notify = (message: string, { type = 'info', action }: { type?: 'info' | 'success' | 'error'; action?: { label: string; run?: () => void; href?: string } } = {}) =>
  eventBus.emit('notice', { message, type, action });
