import { request } from './http.js';

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
      typeof maxLength !== 'number' || !Number.isInteger(maxLength) || maxLength < 50 || maxLength > 20000 ||
      typeof writeEnabled !== 'boolean') {
    throw new Error('Invalid OnlineConf review settings');
  }
  return { revision, maxLength, writeEnabled };
}
