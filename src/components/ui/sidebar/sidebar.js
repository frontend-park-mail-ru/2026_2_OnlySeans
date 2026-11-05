import { createSiteHeader } from '../site-header/site-header.js';
import { element } from '../../../utils/dom.js';

const icons = {
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/>',
  collections:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  collapse: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-12-4 4 4 4"/>',
};
const icon = (name) =>
  `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

export const createSidebar = (page, container, navigate) => {
  const mobile = matchMedia('(max-width: 1000px)');
  let collapsed = false;
  try {
    collapsed = localStorage.getItem('frame:sidebar-collapsed') === 'true';
  } catch {
    /* без localStorage выбор просто не запомнится */
  }
  page.dataset.sidebarCollapsed = String(collapsed);
  const sidebar = element('aside', 'site-sidebar');
  sidebar.id = 'site-sidebar';
  sidebar.setAttribute('aria-label', 'Навигация по сайту');
  const header = createSiteHeader({ navigate });
  const brand = header.querySelector('.site-header__brand');
  const head = element('div', 'site-sidebar__head');
  const sidebarTitle = element('span', 'site-sidebar__title', 'Навигация');
  head.append(sidebarTitle);
  const toggle = element('button');
  toggle.type = 'button';
  toggle.className = 'sidebar-toggle';
  toggle.innerHTML = icon('collapse');
  toggle.setAttribute('aria-controls', sidebar.id);
  head.append(toggle);
  const nav = element('nav', 'sidebar-nav');
  nav.setAttribute('aria-label', 'Разделы сайта');
  const items = [
    [
      'Каталог',
      [
        ['/', 'Главная', 'home'],
        ['/collections', 'Подборки', 'collections'],
      ],
    ],
  ];
  for (const [label, links] of items) {
    const group = element('div', 'sidebar-nav__group');
    const caption = element('p', 'sidebar-nav__caption', label);
    group.append(caption);
    for (const [href, text, name] of links) {
      const link = element('a');
      link.href = href;
      link.dataset.link = '';
      link.className = 'sidebar-nav__link';
      link.title = text;
      link.setAttribute('aria-label', text);
      link.innerHTML = `${icon(name)}<span class="sidebar-nav__text">${text}</span>`;
      if (location.pathname === href || (href === '/' && location.pathname === '/discover'))
        link.setAttribute('aria-current', 'page');
      group.append(link);
    }
    nav.append(group);
  }
  sidebar.append(head, nav);
  header.classList.add('catalog-topbar');
  const opener = element('button');
  opener.type = 'button';
  opener.className = 'sidebar-toggle sidebar-opener';
  opener.innerHTML = icon('menu');
  opener.setAttribute('aria-label', 'Открыть меню');
  opener.setAttribute('aria-controls', sidebar.id);
  opener.setAttribute('aria-expanded', 'false');
  brand.prepend(opener);
  container.prepend(header);
  const backdrop = element('button');
  backdrop.type = 'button';
  backdrop.className = 'sidebar-backdrop';
  backdrop.setAttribute('aria-label', 'Закрыть меню');
  backdrop.tabIndex = -1;
  backdrop.hidden = true;
  let open = false;
  const refresh = () => {
    const visible = !mobile.matches || open;
    sidebar.inert = !visible;
    container.inert = mobile.matches && open;
    sidebar.setAttribute('aria-modal', String(mobile.matches && open));
    if (mobile.matches && open) sidebar.setAttribute('role', 'dialog');
    else sidebar.removeAttribute('role');
    page.dataset.sidebarOpen = String(open);
    backdrop.hidden = !mobile.matches || !open;
    opener.setAttribute('aria-expanded', String(open));
    let toggleLabel = collapsed ? 'Развернуть панель навигации' : 'Свернуть панель навигации';
    if (mobile.matches) toggleLabel = 'Закрыть меню';
    toggle.setAttribute('aria-label', toggleLabel);
    toggle.title = toggle.getAttribute('aria-label');
    toggle.setAttribute('aria-expanded', String(mobile.matches ? open : !collapsed));
  };
  const close = () => {
    open = false;
    refresh();
    opener.focus();
  };
  opener.addEventListener('click', () => {
    open = true;
    refresh();
    toggle.focus();
  });
  backdrop.addEventListener('click', close);
  toggle.addEventListener('click', () => {
    if (mobile.matches) {
      close();
      return;
    }
    collapsed = !collapsed;
    page.dataset.sidebarCollapsed = String(collapsed);
    try {
      localStorage.setItem('frame:sidebar-collapsed', String(collapsed));
    } catch {
      /* не сохранилось — не страшно */
    }
    refresh();
  });
  sidebar.addEventListener('keydown', (event) => {
    if (!mobile.matches || !open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab') {
      const focusable = [...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(
        (node) => node.getClientRects().length,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (
      !link ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (mobile.matches) close();
  });
  const onResize = () => {
    open = false;
    refresh();
    if (sidebar.contains(document.activeElement) && mobile.matches) opener.focus();
  };
  mobile.addEventListener('change', onResize);
  let disposal;
  sidebar.catalogNavigation = {
    attach(nextPage, nextContainer) {
      container.inert = false;
      page = nextPage;
      container = nextContainer;
      open = false;
      page.dataset.sidebarCollapsed = String(collapsed);
      nav.querySelectorAll('a').forEach((link) => {
        const path = new URL(link.href).pathname;
        if (path === location.pathname || (path === '/' && location.pathname === '/discover'))
          link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      refresh();
    },
    dispose() {
      mobile.removeEventListener('change', onResize);
      header.disposeUserWatch();
      disposal?.disconnect();
    },
  };
  requestAnimationFrame(() => {
    if (!sidebar.isConnected) return;
    disposal = new MutationObserver(() => {
      if (!sidebar.isConnected) sidebar.catalogNavigation.dispose();
    });
    disposal.observe(page.parentElement, { childList: true });
  });
  refresh();
  return [sidebar, backdrop];
};
