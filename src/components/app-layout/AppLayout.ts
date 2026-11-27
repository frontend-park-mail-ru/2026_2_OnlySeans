import './app-layout.css';
import templateSource from './AppLayout.hbs';
import { Component } from '../../core/component.js';
import { StorageKey, readJson, writeJson } from '../../services/storage.js';
import { arrive } from '../../services/page-transition.js';
import { Sidebar } from '../sidebar/Sidebar.js';
import { SiteHeader } from '../site-header/SiteHeader.js';
import { loadAssets } from '../../core/assets.js';
import { MobileNav } from '../mobile-nav/MobileNav.js';

const template = await loadAssets({ template: templateSource });

export class AppLayout extends Component {
  static template = template;

  #page: Component | null = null;
  sidebar!: Sidebar;
  header!: SiteHeader;
  mobileNav!: MobileNav;

  context() {
    return { collapsed: readJson<boolean>(StorageKey.SIDEBAR_COLLAPSED, false) === true };
  }

  onRender() {
    this.sidebar = this.insert(
      'sidebar',
      new Sidebar({ collapsed: this.context().collapsed, onToggle: () => this.#toggleSidebar() }),
    );
    this.header = this.insert('header', new SiteHeader({ navigate: this.props.navigate }));
    this.mobileNav = this.insert('mobile-nav', new MobileNav());
  }

  show(page: Component, { toTop = false } = {}) {
    if (
      this.#page?.constructor === page.constructor &&
      'updateRoute' in this.#page &&
      typeof this.#page.updateRoute === 'function'
    ) {
      this.#page.updateRoute(page.props);
      this.header.syncRoute();
      return;
    }
    const content = this.find('.app-layout__content');
    const previous = this.#page;
    this.#page = page;
    content.replaceChildren(page.render());
    if (toTop) window.scrollTo(0, 0);
    previous?.destroy();
    this.sidebar.syncRoute();
    this.header.syncRoute();
    this.mobileNav.syncRoute();
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
