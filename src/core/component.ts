type Template = (context: object) => string;

export class Component<Props extends object = Record<string, any>> {
  static template: Template = null;

  props: Props;
  element: HTMLElement;

  #cleanups: (() => void)[] = [];
  #children: Component[] = [];

  constructor(props = {} as Props) {
    this.props = props;
    this.element = null;
  }

  context(): object {
    return this.props;
  }

  onRender() {}

  render() {
    this.#teardown();
    const host = document.createElement('template');
    host.innerHTML = (this.constructor as typeof Component).template(this.context()).trim();
    this.element = host.content.firstElementChild as HTMLElement;
    this.onRender();
    return this.element;
  }

  update(patch: Partial<Props> = {}) {
    this.props = { ...this.props, ...patch };
    const previous = this.element;
    const next = this.render();
    previous?.replaceWith(next);
    return next;
  }

  refreshContent() {
    const host = document.createElement('template');
    host.innerHTML = (this.constructor as typeof Component).template(this.context()).trim();
    this.element.replaceChildren(...host.content.firstElementChild.childNodes);
  }

  find<T extends HTMLElement = HTMLElement>(selector: string) {
    return this.element.querySelector<T>(selector);
  }

  findAll<T extends HTMLElement = HTMLElement>(selector: string) {
    return [...this.element.querySelectorAll<T>(selector)];
  }

  refs(): Record<string, HTMLElement> {
    return Object.fromEntries(
      this.findAll('[data-ref]').map((element) => [element.dataset.ref, element]),
    );
  }

  insert<T extends Component>(target: string | Element, child: T) {
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

  swap<T extends Component>(previous: Component, next: T) {
    previous.element.replaceWith(next.render());
    this.remove(previous);
    this.#children.push(next);
    return next;
  }

  remove(child: Component) {
    child.destroy();
    this.#children = this.#children.filter((item) => item !== child);
  }

  on<K extends keyof (HTMLElementEventMap & DocumentEventMap)>(event: K, handler: (event: (HTMLElementEventMap & DocumentEventMap)[K]) => void, target: EventTarget = this.element, options?: boolean | AddEventListenerOptions) {
    const listener = handler as EventListener;
    target.addEventListener(event, listener, options);
    this.#cleanups.push(() => target.removeEventListener(event, listener, options));
  }

  delegate(event: keyof HTMLElementEventMap, selector: string, handler: (event: Event, match: HTMLElement) => void) {
    this.on(event, (domEvent) => {
      if (!(domEvent.target instanceof Element)) return;
      const match = domEvent.target.closest<HTMLElement>(selector);
      if (!match || !this.element.contains(match)) return;
      if (this.#children.some((child) => child.element?.contains(match))) return;
      handler(domEvent, match);
    });
  }

  watch(unsubscribe: () => void) {
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
