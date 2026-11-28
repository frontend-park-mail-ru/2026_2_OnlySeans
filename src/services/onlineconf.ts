import { ApiError, isUnavailable } from '../api/http.js';
import { fetchOnlineConf, isReviewLimit } from '../api/onlineconf.js';
import { reviewPolicyErrorMessage, reviewPolicyRevision } from '../api/reviews.js';
import { initialOnlineConf, store } from '../core/store.js';
import { refreshSession } from './session.js';

const POLL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 3_000;
let stopPolling: (() => void) | undefined;
let refreshNow: ((rejection?: ApiError) => Promise<void>) | undefined;

export function refreshOnlineConf() {
  return refreshNow?.();
}

export function handleReviewRejection(error: unknown, authorId: number) {
  if (!(error instanceof ApiError) || authorId !== store.get('user')?.id) return;
  const reason = reviewPolicyErrorMessage(error, store.get('onlineconf').revision);
  if (reason) void refreshNow?.(error);
  return reason;
}

export function startOnlineConf() {
  if (stopPolling) return stopPolling;

  const currentUserId = () => store.get('user')?.id ?? null;
  let pending: AbortController | undefined;
  let deniedThrough = -1;
  let limitedThrough = -1;

  async function refresh(replacePending = false) {
    if (pending && !replacePending) return;
    pending?.abort();
    const userId = currentUserId();
    const controller = new AbortController();
    pending = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const isCurrent = () => pending === controller && currentUserId() === userId;
    try {
      const settings = await fetchOnlineConf(controller.signal);
      if (!isCurrent() || controller.signal.aborted) return;
      const current = store.get('onlineconf');
      // The product backend serves revision zero until it has loaded a snapshot.
      if (settings.revision === 0) {
        store.set({ onlineconf: { ...current, writeEnabled: false, homeBlocks: [], status: 'fallback' } });
        return;
      }
      if (current.revision !== null && settings.revision < current.revision) return;
      store.set({ onlineconf: {
        ...settings, userId,
        writeEnabled: userId !== null && settings.revision > deniedThrough && settings.writeEnabled,
        maxLength: settings.revision <= limitedThrough ? Math.min(current.maxLength, settings.maxLength) : settings.maxLength,
        status: 'ready', lastSuccessAt: Date.now(),
      } });
    } catch (error) {
      if (!isCurrent()) return;
      const current = store.get('onlineconf');
      if (current.revision !== null && current.status !== 'fallback' && (controller.signal.aborted || isUnavailable(error))) {
        store.set({ onlineconf: { ...current, status: 'stale' } });
      } else {
        store.set({ onlineconf: { ...current, writeEnabled: false, homeBlocks: [], status: 'fallback' } });
        if (error instanceof ApiError && error.status === 401 && userId !== null) void refreshSession();
      }
    } finally {
      window.clearTimeout(timeout);
      if (pending === controller) pending = undefined;
    }
  }

  function reset() {
    deniedThrough = -1;
    limitedThrough = -1;
    store.set({ onlineconf: initialOnlineConf(currentUserId()) });
    void refresh(true);
  }

  function refreshIfVisible() {
    if (!document.hidden) void refresh();
  }

  function onPageHide() {
    pending?.abort();
    pending = undefined;
  }

  function onPageShow(event: PageTransitionEvent) {
    if (event.persisted) refreshIfVisible();
  }

  const unsubscribe = store.watch('user', () => {
    if (store.get('onlineconf').userId !== currentUserId()) reset();
  });
  const interval = window.setInterval(refreshIfVisible, POLL_MS);
  document.addEventListener('visibilitychange', refreshIfVisible);
  window.addEventListener('online', refreshIfVisible);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  function stop() {
    if (stopPolling !== stop) return;
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', refreshIfVisible);
    window.removeEventListener('online', refreshIfVisible);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    unsubscribe();
    onPageHide();
    refreshNow = undefined;
    stopPolling = undefined;
  }
  refreshNow = (rejection) => {
    if (rejection) {
      const current = store.get('onlineconf');
      const revision = reviewPolicyRevision(rejection) ?? current.revision ?? 0;
      if (revision < (current.revision ?? 0)) return refresh();
      if (rejection.code === 'feature_disabled') {
        deniedThrough = Math.max(deniedThrough, revision);
        store.set({ onlineconf: { ...current, writeEnabled: false } });
      } else if (isReviewLimit(rejection.details?.max_length) && revision >= limitedThrough) {
        const max = rejection.details.max_length;
        const maxLength = revision === limitedThrough ? Math.min(current.maxLength, max) : max;
        limitedThrough = revision;
        store.set({ onlineconf: { ...current, maxLength } });
      }
    }
    return refresh(true);
  };
  stopPolling = stop;
  reset();
  return stop;
}
