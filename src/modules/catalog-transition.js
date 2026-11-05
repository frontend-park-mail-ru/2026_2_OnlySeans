// оставляем сами элементы навигации вместе с состоянием «открыто/свёрнуто»
export const preserveCatalogNavigation = (current, next) => {
  const sidebar = current.querySelector('.site-sidebar');
  const header = current.querySelector('.catalog-topbar');
  if (!sidebar || !header) return;
  next.querySelector('.site-sidebar').catalogNavigation.dispose();
  next.querySelector('.site-sidebar').replaceWith(sidebar);
  next.querySelector('.catalog-topbar').replaceWith(header);
  next.querySelector('.sidebar-backdrop').replaceWith(current.querySelector('.sidebar-backdrop'));
  sidebar.catalogNavigation.attach(next, next.querySelector('.catalog-container'));
  const account = header.querySelector('.site-header__account');
  if (location.pathname === '/profile') account?.setAttribute('aria-current', 'page');
  else account?.removeAttribute('aria-current');
};
