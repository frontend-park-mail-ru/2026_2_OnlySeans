import { getMovies } from '../../api/movies.js';
import { getSavedMovieIds } from '../../services/movie-lists.js';
import {
  createCatalogPage,
  sectionHeading,
  createStatus,
  showLoadError,
  createMovieTile,
} from '../discover/catalog-ui.js';
import { createCatalogViewToggle } from '../../components/ui/catalog-view/catalog-view.js';
import { authPath } from '../../services/auth-return.js';
import { store } from '../../modules/store.js';
import { readPersonalLibrary, loadPersonalLibrary } from '../../services/personal-library.js';

import { CATALOG_PAGE_SIZE } from '../../components/ui/catalog-view/page-size.js';
import {
  renderPagination,
  pageFromLocation,
  pageHref,
} from '../../components/ui/pagination/pagination.js';
import { element } from '../../utils/dom.js';

const emptyListMessage = (list) => {
  if (list === 'watched') {
    return 'Пока нет просмотренных фильмов. Отмечайте их через кнопку «Моё кино» на карточках.';
  }
  if (list) return 'Здесь пока пусто. Сохраняйте фильмы на главной — они появятся в этом списке.';
  return 'В этом разделе пока нет фильмов.';
};

const sections = {
  '/films': { title: 'Фильмы', type: 'movie', intro: 'Большие истории для вашего экрана.' },
  '/series': {
    title: 'Сериалы',
    type: 'series',
    intro: 'Истории, с которыми хочется остаться подольше.',
  },
  '/watch-later': {
    title: 'Смотреть позже',
    list: 'watchlater',
    intro: 'Ваши планы на следующий киновечер.',
  },
  '/favorites': {
    title: 'Избранное',
    list: 'favorite',
    intro: 'Кино, к которому хочется вернуться.',
  },
  '/watched': {
    title: 'Просмотрено',
    list: 'watched',
    intro: 'Истории, которые вы уже посмотрели.',
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
    if (['favorite', 'watched'].includes(section.list) && !store.get('user')) {
      status.textContent =
        section.list === 'watched'
          ? 'Войдите, чтобы отмечать просмотренные фильмы.'
          : 'Войдите, чтобы отмечать любимые фильмы и собирать избранное.';
      const login = element('a');
      login.href = '/login';
      login.dataset.link = '';
      login.className = 'library-empty-link';
      login.textContent = 'Войти →';
      main.append(heading, intro, status, login);
      return page;
    }
    heading.append(createCatalogViewToggle(grid));
    const pagination = element('nav', 'pagination');
    pagination.setAttribute('aria-label', 'Страницы каталога');
    main.append(heading, intro);
    if (section.list === 'watchlater' && !store.get('user')) {
      const notice = element('p', 'library-guest-notice');
      notice.setAttribute('role', 'note');
      notice.append('Данные неавторизованного пользователя хранятся на вашем компьютере, ');
      const signup = element('a');
      signup.href = authPath('register', '/watch-later');
      signup.dataset.link = '';
      signup.textContent = 'войдите';
      notice.append(signup, ', чтобы синхронизировать с сайтом.');
      main.append(notice);
    }
    main.append(status, grid, pagination);
    let movies = [];
    let currentPage = pageFromLocation();
    const pageSize = CATALOG_PAGE_SIZE;
    const render = () => {
      const byId = new Map(movies.map((movie) => [movie.id, movie]));
      const selected = section.list
        ? (section.list === 'watched'
            ? readPersonalLibrary().watched
            : getSavedMovieIds(section.list)
          )
            .map((id) => byId.get(id))
            .filter(Boolean)
        : movies.filter((movie) => movie.type === section.type);
      const totalPages = Math.max(1, Math.ceil(selected.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);
      grid.replaceChildren(
        ...selected
          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
          .map((movie) => createMovieTile(movie, page)),
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
      status.textContent = selected.length ? '' : emptyListMessage(section.list);
      if (!selected.length && section.list) {
        const link = element('a');
        link.href = '/';
        link.dataset.link = '';
        link.className = 'library-empty-link';
        link.textContent = 'Выбрать фильм →';
        status.append(element('br'), link);
      }
    };
    page.addEventListener('movielistchange', () => {
      if (!section.list) return;
      const focused = grid.contains(document.activeElement);
      render();
      if (focused) (grid.querySelector('a') || status.querySelector('a'))?.focus();
    });
    page.addEventListener('personallibrarychange', () => {
      if (section.list === 'watched') render();
    });
    const load = async () => {
      status.textContent = 'Загружаем фильмы…';
      try {
        if (section.list === 'watched') await loadPersonalLibrary();
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
