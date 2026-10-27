import { getMovies } from '../../api/movies.js';
import { getCollections } from '../../api/collections.js';
import { createCatalogPage, sectionHeading, createStatus, showLoadError, createCollectionCard, createMovieTile } from './catalog-ui.js';
import { createFeaturedMovie } from './hero.js';
import { getSavedMovieIds, toggleSavedMovie } from '../../services/movie-lists.js';
import { syncMovieListButtons } from '../../components/ui/movie-actions/movie-actions.js';
import { observeHomeEntrances } from './home-motion.js';
import { createCatalogViewToggle } from '../../components/ui/catalog-view/catalog-view.js';
import { createPaginationMotion } from './pagination-motion.js';
import { renderPagination, pageFromLocation, pageHref } from '../../components/ui/pagination/pagination.js';

import { CATALOG_PAGE_SIZE } from '../../components/ui/catalog-view/page-size.js';
export class DiscoverPage {
  constructor({ navigate }) {
    this.navigate = navigate;
    this.currentPage = pageFromLocation();
    const params = new URLSearchParams(location.search);
    if (params.has('q') || params.has('genre') || location.hash === '#genres') this.updateUrl();
  }
  render() {
    document.title = 'Главная — Frame';
    const { page, main } = createCatalogPage(this.navigate);this.page = page;main.className = 'home-page';page.classList.add('home-club');
    const featured = document.createElement('div');featured.className = 'featured-slot';featured.append(createStatus('Загружаем фильм недели…'));
    const watchLater = document.createElement('section');watchLater.className = 'watch-later';watchLater.setAttribute('aria-label', 'Смотреть позже');
    watchLater.append(sectionHeading('Смотреть позже', { count: '' }));
    const watchEmpty = document.createElement('div');watchEmpty.className = 'watch-later__empty';
    watchEmpty.innerHTML = `<span class="watch-later__empty-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2"/></svg></span><div><strong>Соберите свой киновечер</strong><p>Нажимайте на часы у фильма — здесь будет ваш список.</p></div><button type="button">Выбрать фильм →</button>`;
    watchEmpty.querySelector('button').addEventListener('click', () => { feed.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });feed.querySelector('.catalog-view-toggle [aria-pressed="true"]')?.focus({ preventScroll: true }); });
    const watchGrid = document.createElement('div');watchGrid.className = 'watch-later__grid';watchGrid.setAttribute('aria-label', 'Сохранённые фильмы');watchLater.append(watchEmpty, watchGrid);
    const watchControls = document.createElement('div');watchControls.className = 'watch-later__controls';watchControls.hidden = true;
    const previous = document.createElement('button');previous.type = 'button';previous.textContent = '←';previous.setAttribute('aria-label', 'Прокрутить сохранённые фильмы назад');
    const next = document.createElement('button');next.type = 'button';next.textContent = '→';next.setAttribute('aria-label', 'Прокрутить сохранённые фильмы вперёд');watchControls.append(previous, next);watchLater.querySelector('.catalog-heading').append(watchControls);
    const updateWatchControls = () => {
      const overflow = watchGrid.scrollWidth - watchGrid.clientWidth;
      watchControls.hidden = watchGrid.hidden || overflow < 2;
      previous.disabled = watchGrid.scrollLeft <= 1;next.disabled = watchGrid.scrollLeft >= overflow - 1;
    };
    [previous, next].forEach((button, index) => button.addEventListener('click', () => watchGrid.scrollBy({ left: (index ? 1 : -1) * Math.max(260, watchGrid.clientWidth * .8), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })));
    watchGrid.addEventListener('scroll', updateWatchControls, { passive: true });
    const watchResize = new ResizeObserver(() => { if (!page.isConnected) { watchResize.disconnect();return; }updateWatchControls(); });watchResize.observe(watchGrid);
    let catalogMovies = [];
    const renderWatchLater = () => {
      const byId = new Map(catalogMovies.map(movie => [movie.id, movie]));
      const saved = getSavedMovieIds('watchlater').map(id => byId.get(id)).filter(Boolean);
      const scroll = watchGrid.scrollLeft;
      const focusedButton = watchGrid.contains(document.activeElement) ? document.activeElement : null;
      const focusedId = focusedButton?.dataset.movieId;
      const previousIds = [...watchGrid.querySelectorAll('[data-movie-list]')].map(button => button.dataset.movieId);
      watchGrid.replaceChildren(...saved.map(movie => createMovieTile(movie, page)));
      watchGrid.scrollLeft = scroll;
      watchEmpty.hidden = saved.length > 0;watchGrid.hidden = !saved.length;
      watchLater.querySelector('.catalog-count').textContent = saved.length ? String(saved.length) : '';
      if (focusedButton) {
        const buttons = [...watchGrid.querySelectorAll('[data-movie-list]')];
        const target = buttons.find(button => button.dataset.movieId === focusedId) || buttons[Math.min(Math.max(0, previousIds.indexOf(focusedId)), buttons.length - 1)] || watchEmpty.querySelector('button');
        target.focus({ preventScroll: true });
      }
      requestAnimationFrame(updateWatchControls);
    };
    let feedbackTimer;
    page.addEventListener('movielistchange', event => {
      const { list, id, undo } = event.detail;
      if (list === 'watchlater') renderWatchLater();
      clearTimeout(feedbackTimer);page.querySelector('.movie-feedback')?.remove();
      if (undo) return;
      const added = getSavedMovieIds(list).includes(id);
      const feedback = document.createElement('div');feedback.className = 'movie-feedback';
      const message = document.createElement('span');message.setAttribute('role', 'status');message.textContent = `${added ? 'Добавлено в' : 'Убрано из'} ${list === 'favorite' ? 'избранного' : '«Смотреть позже»'}`;
      if (added && list === 'favorite') message.textContent = 'Добавлено в избранное';
      const undoButton = document.createElement('button');undoButton.type = 'button';undoButton.textContent = 'Отменить';
      undoButton.addEventListener('click', () => { if (!toggleSavedMovie(list, id)) { message.textContent = 'Не удалось отменить действие.';return; }syncMovieListButtons(page);page.dispatchEvent(new CustomEvent('movielistchange', { detail: { list, id, undo: true } })); });
      feedback.append(message, undoButton);page.append(feedback);
      feedbackTimer = setTimeout(() => { if (!feedback.matches(':hover') && !feedback.contains(document.activeElement)) feedback.remove(); }, 6500);
    });
    const collections = document.createElement('section');collections.className = 'home-collections';collections.append(sectionHeading('Подборки', { link: 'Все подборки →', href: '/collections' }));
    const collectionsStatus = createStatus('Загружаем подборки…');const collectionGrid = document.createElement('div');collectionGrid.className = 'collection-grid';collections.append(collectionsStatus, collectionGrid);
    const collectionNote = document.createElement('p');collectionNote.className = 'home-section-note';collectionNote.textContent = 'Истории под ваше настроение.';collections.querySelector('.catalog-heading').after(collectionNote);
    const feed = document.createElement('section');feed.id = 'feed';feed.className = 'catalog-feed';feed.append(sectionHeading('Лента', { count: '' }));
    const feedNote = document.createElement('p');feedNote.className = 'home-section-note';feedNote.textContent = 'Знакомые истории и новые открытия.';
    const moviesGrid = document.createElement('div');moviesGrid.className = 'movie-grid';
    feed.querySelector('.catalog-heading').append(createCatalogViewToggle(moviesGrid));
    const status = createStatus('Загружаем каталог…');const pagination = document.createElement('nav');pagination.className = 'pagination';pagination.setAttribute('aria-label', 'Страницы ленты');
    const feedURL = () => { const url = new URL(location.href);url.hash = '#feed';return url.href; };
    feed.append(feedNote, status, moviesGrid, pagination);main.append(featured, watchLater, collections, feed);
    const loadCollections = async () => {
      collectionsStatus.textContent = 'Загружаем подборки…';collectionGrid.replaceChildren();
      try { const items = await getCollections();if (!page.isConnected) return;collectionGrid.replaceChildren(...items.slice(0, 3).map(createCollectionCard));collectionsStatus.textContent = items.length ? '' : 'Подборок пока нет.'; }
      catch { if (page.isConnected) showLoadError(collectionsStatus, loadCollections, 'Не удалось загрузить подборки.'); }
    };
    const loadMovies = async () => {
      status.textContent = 'Загружаем каталог…';moviesGrid.replaceChildren();pagination.replaceChildren();
      try {
        const movies = await getMovies();if (!page.isConnected) return;
        catalogMovies = movies;renderWatchLater();
        featured.replaceChildren(movies.length ? createFeaturedMovie(movies, page) : createStatus('Каталог пока пуст.'));
        const pageSize = CATALOG_PAGE_SIZE;
        const renderFeed = () => {
          const filtered = movies;
          const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));this.currentPage = Math.min(this.currentPage, totalPages);
          const start = (this.currentPage - 1) * pageSize;
          moviesGrid.replaceChildren(...filtered.slice(start, start + pageSize).map(movie => createMovieTile(movie, page)));
          feed.querySelector('.catalog-count').textContent = `${filtered.length} фильмов и сериалов`;
          status.textContent = filtered.length ? '' : 'Каталог пока пуст.';
          pagination.hidden = totalPages <= 1;
          renderPagination(pagination, { current: this.currentPage, total: totalPages, hrefFor: number => pageHref(number, feedURL()), onSelect: (number, link) => { void changePage(number, link); } });
        };
        const changePage = createPaginationMotion({ page, feed, grid: moviesGrid, pagination, getCurrentPage: () => this.currentPage, render: target => { this.currentPage = target;renderFeed();this.updateUrl({ push: true }); } });
        renderFeed();
        if (new URLSearchParams(location.search).get('page') !== (this.currentPage > 1 ? String(this.currentPage) : null)) this.updateUrl();
        if (location.hash === '#feed') feed.scrollIntoView({ block: 'start' });
      } catch { if (page.isConnected) { featured.replaceChildren(createStatus('Фильм недели недоступен.'));showLoadError(status, loadMovies, 'Не удалось загрузить каталог.'); } }
    };
    requestAnimationFrame(() => { if (page.isConnected) observeHomeEntrances(page); });
    void loadMovies();void loadCollections();return page;
  }
  updateUrl({ push = false } = {}) {
    const url = new URL(location.href);url.searchParams.delete('page');url.searchParams.delete('genre');url.searchParams.delete('q');
    if (this.currentPage > 1) url.searchParams.set('page', this.currentPage);
    // Смена страницы ленты — всегда «#feed»: «Назад»/«Вперёд» и ссылка в новой вкладке ведут сразу к ленте.
    if (url.hash === '#genres' || push) url.hash = '#feed';
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (push) this.navigate(path, { render: false });
    else history.replaceState(history.state, '', path);
  }
}
