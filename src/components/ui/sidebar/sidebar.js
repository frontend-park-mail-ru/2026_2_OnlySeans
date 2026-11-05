import { createSiteHeader } from '../site-header/site-header.js';
import { getSavedMovieIds } from '../../../services/movie-lists.js';
import { store } from '../../../modules/store.js';
import { element } from '../../../utils/dom.js';

const icons = {
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/>',
  films:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',
  series: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m8 2 4 4 4-4m-6 9 5 3-5 3z"/>',
  collections:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  watchlater: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  favorite:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  watched:
    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  personal: '<path d="M3 7V5h6l2 2h10v13H3V7Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
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
        ['/films', 'Фильмы', 'films'],
        ['/series', 'Сериалы', 'series'],
        ['/collections', 'Подборки', 'collections'],
      ],
    ],
    [
      'Моё кино',
      [
        ['/profile', 'Мой профиль', 'user'],
        ['/watch-later', 'Смотреть позже', 'watchlater'],
        ['/watched', 'Просмотрено', 'watched'],
        ['/favorites', 'Избранное', 'favorite'],
        ['/my-collections', 'Мои коллекции', 'personal'],
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
      if (['watched', 'personal', 'user'].includes(name)) {
        link.dataset.authOnly = '';
        link.hidden = !store.get('user');
      }
      if (['watchlater', 'favorite'].includes(name)) {
        const count = element('span', 'sidebar-nav__count');
        count.dataset.savedCount = name;
        link.append(count);
      }
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
  const updateCounts = () => {
    nav.querySelectorAll('[data-auth-only]').forEach((link) => {
      link.hidden = !store.get('user');
    });
    sidebar.querySelectorAll('[data-saved-count]').forEach((node) => {
      const list = node.dataset.savedCount;
      const count = getSavedMovieIds(list).length;
      node.textContent = count > 99 ? '99+' : String(count || '');
      node.title = count > 99 ? `Всего: ${count}` : '';
      node.hidden = !count;
    });
  };
  const onResize = () => {
    open = false;
    refresh();
    if (sidebar.contains(document.activeElement) && mobile.matches) opener.focus();
  };
  mobile.addEventListener('change', onResize);
  window.addEventListener('storage', updateCounts);
  page.addEventListener('movielistchange', updateCounts);
  page.addEventListener('personallibrarychange', updateCounts);
  const stopUserWatch = store.watch('user', updateCounts);
  let disposal;
  sidebar.catalogNavigation = {
    attach(nextPage, nextContainer) {
      page.removeEventListener('movielistchange', updateCounts);
      page.removeEventListener('personallibrarychange', updateCounts);
      container.inert = false;
      page = nextPage;
      container = nextContainer;
      open = false;
      page.dataset.sidebarCollapsed = String(collapsed);
      page.addEventListener('movielistchange', updateCounts);
      page.addEventListener('personallibrarychange', updateCounts);
      nav.querySelectorAll('a').forEach((link) => {
        const path = new URL(link.href).pathname;
        if (path === location.pathname || (path === '/' && location.pathname === '/discover'))
          link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      updateCounts();
      refresh();
    },
    dispose() {
      mobile.removeEventListener('change', onResize);
      window.removeEventListener('storage', updateCounts);
      page.removeEventListener('movielistchange', updateCounts);
      page.removeEventListener('personallibrarychange', updateCounts);
      stopUserWatch();
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
  updateCounts();
  refresh();
  return [sidebar, backdrop];
};
