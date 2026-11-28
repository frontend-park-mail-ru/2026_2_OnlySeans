import { ApiError, request } from '../api/http.js';
import { store } from '../core/store.js';

const interval = 15_000;
const timeout = 2_000;

export type OnlineConfRuntime = {
  revision: number;
  configs: Record<string, unknown>;
  flags: Record<string, boolean>;
};

export function startOnlineConfRuntime() {
  let active: AbortController;
  let timer: ReturnType<typeof setInterval>;
  let userId = store.get('user')?.id;

  async function refresh() {
    if (active || document.hidden) return;
    const controller = new AbortController();
    active = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(timeout)]);
    try {
      const runtime = await request<OnlineConfRuntime>('/onlineconf/runtime', { signal });
      if (signal.aborted || !Number.isSafeInteger(runtime?.revision) || runtime.revision < 0 ||
        !runtime.configs || !runtime.flags) return;
      const previous = store.get('onlineConf');
      if (!previous || runtime.revision > previous.revision) store.set({ onlineConf: runtime });
    } catch (error) {
      if (!signal.aborted && error instanceof ApiError && error.status === 401) {
        store.set({ onlineConf: null });
      }
    } finally {
      if (active === controller) active = undefined;
    }
  }

  function stop() {
    active?.abort();
    active = undefined;
    clearInterval(timer);
  }

  function restart() {
    stop();
    if (document.hidden) return;
    void refresh();
    timer = setInterval(refresh, interval);
  }

  store.watch('user', (user) => {
    if (user?.id === userId) return;
    userId = user?.id;
    store.set({ onlineConf: null });
    restart();
  });
  document.addEventListener('visibilitychange', restart);
  window.addEventListener('online', restart);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', (event) => { if (event.persisted) restart(); });
  restart();
}
