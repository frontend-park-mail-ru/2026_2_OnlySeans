import { request } from './http.js';
import { homeBlocksFlag, homeBlocksKey, parseHomeBlocks, type HomeBlock } from '../configured-ui/home-blocks.js';

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
  let homeBlocks: HomeBlock[] = [];
  const blocks = data.configs[homeBlocksKey];
  if (data.flags[homeBlocksFlag] === true && blocks !== undefined) {
    try {
      homeBlocks = parseHomeBlocks(blocks);
    } catch {
      // Malformed optional UI config must not prevent review settings from applying.
    }
  }
  return { revision, maxLength, writeEnabled, homeBlocks };
}
