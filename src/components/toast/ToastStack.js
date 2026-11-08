import { Component } from '../../core/component.js';
import { eventBus } from '../../core/event-bus.js';
import { Toast } from './Toast.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./toast.css', import.meta.url));
const template = await loadTemplate(new URL('./ToastStack.hbs', import.meta.url));

const DURATION = { error: 8000, info: 4000, success: 4000 };

export class ToastStack extends Component {
  static template = template;

  #shown = new Map();

  onRender() {
    this.watch(eventBus.on('notice', (notice) => this.#show(notice)));
  }

  #show(notice) {
    const key = `${notice.type}:${notice.message}`;
    const existing = this.#shown.get(key);
    if (existing) {
      this.#restartTimer(existing, notice.type);
      return;
    }
    const entry = { timer: null };
    entry.toast = this.insert(
      this.element,
      new Toast({ ...notice, onClose: () => this.#close(key) }),
    );
    this.#shown.set(key, entry);
    this.#restartTimer(entry, notice.type);

    if (this.element.matches(':popover-open')) this.element.hidePopover();
    this.element.showPopover();
  }

  #restartTimer(entry, type) {
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => entry.toast.props.onClose(), DURATION[type] || DURATION.info);
  }

  async #close(key) {
    const entry = this.#shown.get(key);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.#shown.delete(key);
    await this.#leave(entry.toast.element);
    this.remove(entry.toast);
    if (!this.#shown.size && this.element.matches(':popover-open')) this.element.hidePopover();
  }

  #leave(element) {
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    const keyframes = [{ opacity: 1 }, { opacity: 0, transform: 'translateX(16px)' }];
    return element.animate(keyframes, { duration: 200, easing: 'ease-in', fill: 'forwards' })
      .finished;
  }
}
