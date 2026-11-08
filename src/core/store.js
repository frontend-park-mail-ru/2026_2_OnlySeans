import { eventBus } from './event-bus.js';

class Store {
  #state = { user: null, myReview: null };

  get(key) {
    return this.#state[key];
  }

  set(patch) {
    const previous = this.#state;
    this.#state = { ...previous, ...patch };
    Object.keys(patch).forEach((key) => {
      if (previous[key] !== this.#state[key]) eventBus.emit(`store:${key}`, this.#state[key]);
    });
  }

  watch(key, handler) {
    return eventBus.on(`store:${key}`, handler);
  }
}

export const store = new Store();
