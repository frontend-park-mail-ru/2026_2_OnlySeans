export class Component {
  static template = null;

  #cleanups = [];
  #children = [];

  constructor(props = {}) {
    this.props = props;
    this.element = null;
  }

  context() {
    return this.props;
  }

  onRender() {}

  render() {
    this.#teardown();
    const host = document.createElement('template');
    host.innerHTML = this.constructor.template(this.context()).trim();
    this.element = host.content.firstElementChild;
    this.onRender();
    return this.element;
  }

  update(patch = {}) {
    this.props = { ...this.props, ...patch };
    const previous = this.element;
    const next = this.render();
    previous?.replaceWith(next);
    return next;
  }

  refreshContent() {
    const host = document.createElement('template');
    host.innerHTML = this.constructor.template(this.context()).trim();
    this.element.replaceChildren(...host.content.firstElementChild.childNodes);
  }

  find(selector) {
    return this.element.querySelector(selector);
  }

  findAll(selector) {
    return [...this.element.querySelectorAll(selector)];
  }

  refs() {
    return Object.fromEntries(
      this.findAll('[data-ref]').map((element) => [element.dataset.ref, element]),
    );
  }

  insert(target, child) {
    const node = child.render();
    if (typeof target === 'string') {
      const slot = this.find(`[data-slot="${target}"]`);

      if (slot.attributes.length > 1)
        throw new Error(`На заглушке data-slot="${target}" не должно быть других атрибутов`);
      slot.replaceWith(node);
    } else target.append(node);
    this.#children.push(child);
    return child;
  }

  swap(previous, next) {
    previous.element.replaceWith(next.render());
    this.remove(previous);
    this.#children.push(next);
    return next;
  }

  remove(child) {
    child.destroy();
    this.#children = this.#children.filter((item) => item !== child);
  }

  on(event, handler, target = this.element, options) {
    target.addEventListener(event, handler, options);
    this.#cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  delegate(event, selector, handler) {
    this.on(event, (domEvent) => {
      const match = domEvent.target.closest?.(selector);
      if (!match || !this.element.contains(match)) return;
      if (this.#children.some((child) => child.element?.contains(match))) return;
      handler(domEvent, match);
    });
  }

  watch(unsubscribe) {
    this.#cleanups.push(unsubscribe);
  }

  #teardown() {
    this.#children.forEach((child) => child.destroy());
    this.#children = [];
    this.#cleanups.splice(0).forEach((cleanup) => cleanup());
  }

  destroy() {
    this.#teardown();
    this.element?.remove();
    this.element = null;
  }
}
