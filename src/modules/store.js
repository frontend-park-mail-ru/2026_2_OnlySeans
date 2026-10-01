import { eventBus } from './event-bus.js';

const CHANGE = 'store:change';

export class Store {
  #state;

  constructor(initialState = {}, bus = eventBus) {
    this.#state = { ...initialState };
    this.bus = bus;
  }

  getState() {
    return { ...this.#state };
  }

  get(key) {
    return this.#state[key];
  }

  /** Обновить часть состояния и сообщить об этом через шину. */
  setState(patch) {
    const prev = this.#state;
    this.#state = { ...prev, ...patch };

    Object.keys(patch).forEach((key) => {
      if (prev[key] !== this.#state[key]) {
        this.bus.emit(`${CHANGE}:${key}`, this.#state[key]);
      }
    });
    this.bus.emit(CHANGE, this.getState());
  }

  /** Следить за изменением одного поля. Возвращает функцию, которая перестаёт следить. */
  watch(key, handler) {
    return this.bus.listen(`${CHANGE}:${key}`, handler);
  }
}

export const store = new Store({ user: null });
