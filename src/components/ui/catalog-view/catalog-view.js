const preferenceKey = 'frame:catalog-view';
export const createCatalogViewToggle = (grid) => {
  let revision = 0;
  let view = 'grid';
  try {
    if (localStorage.getItem(preferenceKey) === 'list') view = 'list';
  } catch {
    /* по умолчанию сетка */
  }
  const group = element('div', 'catalog-view-toggle');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Отображение фильмов');
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<rect x="3" y="3" width="5" height="7" rx="1"/><rect x="3" y="14" width="5" height="7" rx="1"/><path d="M12 5h9m-9 4h6m-6 7h9m-9 4h6"/>',
  };
  const apply = () => {
    grid.dataset.view = view;
    group
      .querySelectorAll('button')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.view === view)),
      );
  };
  for (const [value, label] of [
    ['grid', 'Сетка'],
    ['list', 'Список'],
  ]) {
    const button = element('button');
    button.type = 'button';
    button.dataset.view = value;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${paths[value]}</svg><span>${label}</span>`;
    button.addEventListener('click', () => {
      if (value === view) return;
      view = value;
      const current = ++revision;
      // дожидаемся конца анимации пагинации, иначе снимок карточек будет неверным
      grid.dispatchEvent(new Event('catalogviewchange'));
      group
        .querySelectorAll('button')
        .forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.view === view)));
      try {
        localStorage.setItem(preferenceKey, view);
      } catch {
        /* без localStorage выбор просто не запомнится */
      }
      animateCatalogLayout(grid, () => {
        if (current === revision && grid.isConnected) apply();
      });
    });
    group.append(button);
  }
  apply();
  return group;
};
import { animateCatalogLayout } from './layout-motion.js';
import { element } from '../../../utils/dom.js';
