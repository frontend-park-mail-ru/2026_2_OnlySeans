import { eventBus } from '../core/event-bus.js';
export interface Notice {
  message: string;
  type: 'info' | 'success' | 'error';
  duration?: number;
  action?: { label: string; run?: () => void; href?: string };
}

export const notify = (
  message: string,
  {
    type = 'info',
    action,
    duration,
  }: {
    type?: 'info' | 'success' | 'error';
    duration?: number;
    action?: { label: string; run?: () => void; href?: string };
  } = {},
) => eventBus.emit('notice', { message, type, action, duration });
