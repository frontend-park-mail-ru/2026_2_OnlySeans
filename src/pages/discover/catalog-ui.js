import { createSidebar } from '../../components/ui/sidebar/sidebar.js';
import { element } from '../../utils/dom.js';

export const createCatalogPage = (navigate) => {
  const page = element('div', 'catalog-page');
  const container = element('div', 'catalog-container');
  const main = element('main');
  container.append(main);
  page.append(...createSidebar(page, container, navigate), container);
  return { page, main };
};
