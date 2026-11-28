import { request } from './http.js';
import type { OnlineConfState } from '../core/store.js';

export function isReviewLimit(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 50 && value <= 20000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function fetchOnlineConf(signal: AbortSignal) {
  const data = await request('/onlineconf/runtime', { signal });
  if (!isRecord(data) || !isRecord(data.configs) || !isRecord(data.flags)) {
    throw new Error('Invalid OnlineConf response');
  }

  const revision = data.revision;
  const maxLength = data.configs['reviews.max_length'];
  const writeEnabled = data.flags['reviews.write_enabled'];
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0 ||
      !isReviewLimit(maxLength) ||
      typeof writeEnabled !== 'boolean') {
    throw new Error('Invalid OnlineConf review settings');
  }
  const theme = data.configs['frontend.watch_button_theme'];
  const watchButtonTheme: OnlineConfState['watchButtonTheme'] =
    data.flags['frontend.watch_button_theme_enabled'] === true && (theme === 'amber' || theme === 'wine') ? theme : null;
  return { revision, maxLength, writeEnabled, watchButtonTheme };
}
