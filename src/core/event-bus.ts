class EventBus {
  #listeners = new Map<string, Set<(payload: unknown) => void>>();

  on<T>(event: string, handler: (payload: T) => void) {
    const listener = (payload: unknown) => handler(payload as T);
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, handler: (payload: unknown) => void) {
    const handlers = this.#listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler);
    if (!handlers.size) this.#listeners.delete(event);
  }

  emit(event: string, payload: unknown) {
    [...(this.#listeners.get(event) || [])].forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Ошибка в обработчике события "${event}"`, error);
      }
    });
  }
}

export const eventBus = new EventBus();
