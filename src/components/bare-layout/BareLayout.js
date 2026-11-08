import './bare-layout.css';
import templateSource from './BareLayout.hbs';
import { Component } from '../../core/component.js';
import { arrive } from '../../services/page-transition.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class BareLayout extends Component {
  static template = template;

  #page = null;

  show(page, { toTop = false } = {}) {
    const previous = this.#page;

    if (previous?.constructor === page.constructor && previous.reuse?.(page.props)) return;
    this.#page = page;
    this.element.replaceChildren(page.render());
    if (toTop) window.scrollTo(0, 0);
    previous?.destroy();
    arrive(this.element, { rise: false });
  }

  destroy() {
    this.#page?.destroy();
    super.destroy();
  }
}
