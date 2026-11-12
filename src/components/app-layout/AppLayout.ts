import './app-layout.css';
import templateSource from './AppLayout.hbs';
import { Component } from '../../core/component.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { arrive } from '../../services/page-transition.js';
import { Sidebar } from '../sidebar/Sidebar.js';
import { SiteHeader } from '../site-header/SiteHeader.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class AppLayout extends Component {
  static template = template;

  #page = null;
  sidebar: Sidebar;
  header: SiteHeader;

  context() {
    return { collapsed: readJson(StorageKey.SIDEBAR_COLLAPSED, false) === true };
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
    writeJson(StorageKey.SIDEBAR_COLLAPSED, collapsed);
    this.sidebar.update({ collapsed });
  }
}
