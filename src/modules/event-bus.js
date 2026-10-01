export class EventBus {
  #listeners = new Map();

  listen(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);

    return () => this.unlisten(event, handler);
  }

  listenOnce(event, handler) {
    const stop = this.listen(event, (payload) => {
      stop();
      handler(payload);
    });

    return stop;
  }

  unlisten(event, handler) {
    const handlers = this.#listeners.get(event);
    if (!handlers) return;

    handlers.delete(handler);
    if (handlers.size === 0) this.#listeners.delete(event);
  }

  emit(event, payload) {
    const handlers = this.#listeners.get(event);
    if (!handlers) return;

    [...handlers].forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Ошибка в слушателе события "${event}":`, error);
      }
    });
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REGISTER: 'auth:register',
};
