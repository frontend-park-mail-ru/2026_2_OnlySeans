import { Component } from '../../core/component.js';
import { readJson, writeJson } from '../../services/storage.js';
import { arrive } from '../../services/page-transition.js';
import { Sidebar } from '../sidebar/Sidebar.js';
import { SiteHeader } from '../site-header/SiteHeader.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./app-layout.css', import.meta.url));
const template = await loadTemplate(new URL('./AppLayout.hbs', import.meta.url));

const COLLAPSED_KEY = 'frame:sidebar-collapsed';

export class AppLayout extends Component {
  static template = template;

  #page = null;

  context() {
    return { collapsed: readJson(COLLAPSED_KEY, false) === true };
  }

  onRender() {
    this.sidebar = this.insert(
      'sidebar',
      new Sidebar({ collapsed: this.context().collapsed, onToggle: () => this.#toggleSidebar() }),
    );
    this.header = this.insert('header', new SiteHeader());
  }

  show(page, { toTop = false } = {}) {
    const content = this.find('.app-layout__content');
    const previous = this.#page;
    this.#page = page;
    content.replaceChildren(page.render());
    if (toTop) window.scrollTo(0, 0);
    previous?.destroy();
    this.sidebar.syncRoute();
    this.header.syncRoute();
    arrive(content);
  }

  destroy() {
    this.#page?.destroy();
    super.destroy();
  }

  #toggleSidebar() {
    const collapsed = this.element.dataset.sidebarCollapsed !== 'true';
    this.element.dataset.sidebarCollapsed = String(collapsed);
    writeJson(COLLAPSED_KEY, collapsed);
    this.sidebar.update({ collapsed });
  }
}
