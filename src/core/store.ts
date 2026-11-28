import { eventBus } from './event-bus.js';
import type { Review } from '../api/reviews.js';
import type { Account } from '../services/offline-storage.js';

interface OnlineConfState {
  userId: number | null;
  revision: number | null;
  maxLength: number;
  writeEnabled: boolean;
  status: 'loading' | 'ready' | 'stale' | 'fallback';
  lastSuccessAt: number | null;
}

export function initialOnlineConf(userId: number | null): OnlineConfState {
  return { userId, revision: null, maxLength: 20000, writeEnabled: false, status: 'loading', lastSuccessAt: null };
}

interface StoreState {
  onlineconf: OnlineConfState;
  user: Account | null;
  myReview: { filmId: number; review: Review | null; score: number } | null;
  avatarUrl: string;
  avatar?: { userId: number; url: string };
}

class Store {
  #state: StoreState = { user: null, myReview: null, avatarUrl: '', onlineconf: initialOnlineConf(null) };

  get<K extends keyof StoreState>(key: K) {
    return this.#state[key];
  }

  set(patch: Partial<StoreState>) {
    const previous = this.#state;
    this.#state = { ...previous, ...patch };
    (Object.keys(patch) as (keyof StoreState)[]).forEach((key) => {
      if (previous[key] !== this.#state[key]) eventBus.emit(`store:${key}`, this.#state[key]);
    });
  }

  watch<K extends keyof StoreState>(key: K, handler: (value: StoreState[K]) => void) {
    return eventBus.on(`store:${key}`, handler);
  }
}

export const store = new Store();
