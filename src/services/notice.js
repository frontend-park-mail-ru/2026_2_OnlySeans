import { eventBus } from '../core/event-bus.js';

export const notify = (message, { type = 'info', action } = {}) =>
  eventBus.emit('notice', { message, type, action });
