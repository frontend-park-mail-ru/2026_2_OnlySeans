import { getMovies } from '../../api/movies.js';
import {
  createCatalogPage,
  sectionHeading,
  createStatus,
  showLoadError,
  createMovieTile,
} from '../discover/catalog-ui.js';
import { createCatalogViewToggle } from '../../components/ui/catalog-view/catalog-view.js';

import { CATALOG_PAGE_SIZE } from '../../components/ui/catalog-view/page-size.js';
import {
  renderPagination,
  pageFromLocation,
  pageHref,
} from '../../components/ui/pagination/pagination.js';
import { element } from '../../utils/dom.js';

const sections = {
  '/films': { title: 'Фильмы', type: 'movie', intro: 'Большие истории для вашего экрана.' },
  '/series': {
    title: 'Сериалы',
    type: 'series',
    intro: 'Истории, с которыми хочется остаться подольше.',
  },
};
export class CatalogPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }
  render() {
    const section = sections[location.pathname];
    document.title = `${section.title} — Frame`;
    const { page, main } = createCatalogPage(this.navigate);
    main.className = 'library-page';
    const heading = sectionHeading(section.title, { level: 1, count: '' });
    const intro = element('p', 'collections-page__intro', section.intro);
    const status = createStatus('Загружаем фильмы…');
    const grid = element('div', 'movie-grid');
    heading.append(createCatalogViewToggle(grid));
    const pagination = element('nav', 'pagination');
    pagination.setAttribute('aria-label', 'Страницы каталога');
    main.append(heading, intro);
    main.append(status, grid, pagination);
    let movies = [];
    let currentPage = pageFromLocation();
    const pageSize = CATALOG_PAGE_SIZE;
    const render = () => {
      const selected = movies.filter((movie) => movie.type === section.type);
      const totalPages = Math.max(1, Math.ceil(selected.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);
      grid.replaceChildren(
        ...selected
          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
          .map((movie) => createMovieTile(movie)),
      );
      // Адрес всегда соответствует показанной странице: ?page=999 → последняя, ?page=1 и мусор → без параметра.
      const canonical = pageHref(currentPage);
      if (canonical !== `${location.pathname}${location.search}${location.hash}`)
        history.replaceState(history.state, '', canonical);
      renderPagination(pagination, {
        current: currentPage,
        total: totalPages,
        onSelect: (number) => this.navigate(pageHref(number)),
      });
      heading.querySelector('.catalog-count').textContent = String(selected.length);
      status.textContent = selected.length ? '' : 'В этом разделе пока нет фильмов.';
    };
    const load = async () => {
      status.textContent = 'Загружаем фильмы…';
      try {
        movies = await getMovies();
        if (page.isConnected) render();
      } catch {
        if (page.isConnected) showLoadError(status, load);
      }
    };
    void load();
    return page;
  }
}
