import { getMovies } from '../../api/movies.js';
import { getCollections } from '../../api/collections.js';
import {
  createCatalogPage,
  sectionHeading,
  createStatus,
  showLoadError,
  createCollectionCard,
  createMovieTile,
} from './catalog-ui.js';
import { createFeaturedMovie } from './hero.js';
import { observeHomeEntrances } from './home-motion.js';
import { createCatalogViewToggle } from '../../components/ui/catalog-view/catalog-view.js';
import { createPaginationMotion } from './pagination-motion.js';
import {
  renderPagination,
  pageFromLocation,
  pageHref,
} from '../../components/ui/pagination/pagination.js';

import { CATALOG_PAGE_SIZE } from '../../components/ui/catalog-view/page-size.js';
import { element } from '../../utils/dom.js';
export class DiscoverPage {
  constructor({ navigate }) {
    this.navigate = navigate;
    this.currentPage = pageFromLocation();
    const params = new URLSearchParams(location.search);
    if (params.has('q') || params.has('genre') || location.hash === '#genres') this.updateUrl();
  }
  render() {
    document.title = 'Главная — Frame';
    const { page, main } = createCatalogPage(this.navigate);
    this.page = page;
    main.className = 'home-page';
    page.classList.add('home-club');
    const featured = element('div', 'featured-slot');
    featured.append(createStatus('Загружаем фильм недели…'));
    const collections = element('section', 'home-collections');
    collections.append(
      sectionHeading('Подборки', { link: 'Все подборки →', href: '/collections' }),
    );
    const collectionsStatus = createStatus('Загружаем подборки…');
    const collectionGrid = element('div', 'collection-grid');
    collections.append(collectionsStatus, collectionGrid);
    const collectionNote = element('p', 'home-section-note', 'Истории под ваше настроение.');
    collections.querySelector('.catalog-heading').after(collectionNote);
    const feed = element('section');
    feed.id = 'feed';
    feed.className = 'catalog-feed';
    feed.append(sectionHeading('Лента', { count: '' }));
    const feedNote = element('p', 'home-section-note', 'Знакомые истории и новые открытия.');
    const moviesGrid = element('div', 'movie-grid');
    feed.querySelector('.catalog-heading').append(createCatalogViewToggle(moviesGrid));
    const status = createStatus('Загружаем каталог…');
    const pagination = element('nav', 'pagination');
    pagination.setAttribute('aria-label', 'Страницы ленты');
    const feedURL = () => {
      const url = new URL(location.href);
      url.hash = '#feed';
      return url.href;
    };
    feed.append(feedNote, status, moviesGrid, pagination);
    main.append(featured, collections, feed);
    const loadCollections = async () => {
      collectionsStatus.textContent = 'Загружаем подборки…';
      collectionGrid.replaceChildren();
      try {
        const items = await getCollections();
        if (!page.isConnected) return;
        collectionGrid.replaceChildren(...items.slice(0, 3).map(createCollectionCard));
        collectionsStatus.textContent = items.length ? '' : 'Подборок пока нет.';
      } catch {
        if (page.isConnected)
          showLoadError(collectionsStatus, loadCollections, 'Не удалось загрузить подборки.');
      }
    };
    const loadMovies = async () => {
      status.textContent = 'Загружаем каталог…';
      moviesGrid.replaceChildren();
      pagination.replaceChildren();
      try {
        const movies = await getMovies();
        if (!page.isConnected) return;
        featured.replaceChildren(
          movies.length ? createFeaturedMovie(movies, page) : createStatus('Каталог пока пуст.'),
        );
        const pageSize = CATALOG_PAGE_SIZE;
        const renderFeed = () => {
          const filtered = movies;
          const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
          this.currentPage = Math.min(this.currentPage, totalPages);
          const start = (this.currentPage - 1) * pageSize;
          moviesGrid.replaceChildren(
            ...filtered.slice(start, start + pageSize).map((movie) => createMovieTile(movie)),
          );
          feed.querySelector('.catalog-count').textContent =
            `${filtered.length} фильмов и сериалов`;
          status.textContent = filtered.length ? '' : 'Каталог пока пуст.';
          pagination.hidden = totalPages <= 1;
          renderPagination(pagination, {
            current: this.currentPage,
            total: totalPages,
            hrefFor: (number) => pageHref(number, feedURL()),
            onSelect: (number, link) => {
              void changePage(number, link);
            },
          });
        };
        const changePage = createPaginationMotion({
          page,
          feed,
          grid: moviesGrid,
          pagination,
          getCurrentPage: () => this.currentPage,
          render: (target) => {
            this.currentPage = target;
            renderFeed();
            this.updateUrl({ push: true });
          },
        });
        renderFeed();
        if (
          new URLSearchParams(location.search).get('page') !==
          (this.currentPage > 1 ? String(this.currentPage) : null)
        )
          this.updateUrl();
        if (location.hash === '#feed') feed.scrollIntoView({ block: 'start' });
      } catch {
        if (page.isConnected) {
          featured.replaceChildren(createStatus('Фильм недели недоступен.'));
          showLoadError(status, loadMovies, 'Не удалось загрузить каталог.');
        }
      }
    };
    requestAnimationFrame(() => {
      if (page.isConnected) observeHomeEntrances(page);
    });
    void loadMovies();
    void loadCollections();
    return page;
  }
  updateUrl({ push = false } = {}) {
    const url = new URL(location.href);
    url.searchParams.delete('page');
    url.searchParams.delete('genre');
    url.searchParams.delete('q');
    if (this.currentPage > 1) url.searchParams.set('page', this.currentPage);
    // Смена страницы ленты — всегда «#feed»: «Назад»/«Вперёд» и ссылка в новой вкладке ведут сразу к ленте.
    if (url.hash === '#genres' || push) url.hash = '#feed';
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (push) this.navigate(path, { render: false });
    else history.replaceState(history.state, '', path);
  }
}
