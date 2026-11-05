import { createScrollRow } from '../film/scroll-row.js';
import { createLogoutButton } from '../../components/ui/logout-button/logout-button.js';
import { confirmLogout } from '../../components/ui/logout-button/confirm-logout.js';
import {
  createCatalogPage,
  createMovieTile,
  createPosterStack,
  filmCount,
} from '../discover/catalog-ui.js';
import { store } from '../../modules/store.js';
import { getSavedMovieIds } from '../../services/movie-lists.js';
import { loadPersonalLibrary, readPersonalLibrary } from '../../services/personal-library.js';
import { getCatalog } from '../../services/catalog-cache.js';
import { loginForCurrentPage } from '../../services/auth-return.js';
import { skeletons, showRetry } from '../film/film-ui.js';
import { element } from '../../utils/dom.js';
import { pageLink, portrait, sectionHead, emptyState, onPageRemoved } from './people-ui.js';

const maskEmail = (email) => {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return local ? '***' : '';
  // у коротких адресов показываем меньше символов, чтобы не раскрыть почту
  let edge = 0;
  if (local.length > 2) edge = 1;
  if (local.length > 4) edge = 2;
  return `${local.slice(0, edge)}***${edge ? local.slice(-edge) : ''}@${domain}`;
};

export class ProfilePage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }
  render() {
    document.title = 'Мой профиль — Frame';
    const { page, main } = createCatalogPage(this.navigate);
    main.className = 'people-page profile-page';
    const guest = () => {
      document.title = 'Мой профиль — Frame';
      main.replaceChildren(
        emptyState(
          'Ваше место в Frame',
          'Войдите, чтобы открыть профиль, избранное и свои коллекции.',
          loginForCurrentPage(),
          'Войти в аккаунт',
        ),
      );
    };
    const user = store.get('user');
    if (!user) {
      guest();
      return page;
    }
    const name = user.username || user.name || 'Зритель';
    document.title = `${name} · Профиль — Frame`;
    const hero = element('header', 'person-hero profile-hero');
    const intro = element('div', 'person-hero__copy');
    intro.append(
      element('p', 'film-eyebrow', 'Моё кино'),
      element('h1', '', name),
      element('p', 'person-original', maskEmail(user.email)),
      element('p', 'person-intro', 'Любимые истории, планы на вечер и коллекции, собранные вами.'),
    );
    hero.append(portrait(name, '', 'profile-avatar'), intro);
    const stats = element('nav', 'profile-stats');
    stats.setAttribute('aria-label', 'Моя библиотека');
    const library = element('section', 'profile-library');
    library.setAttribute('aria-label', 'Мои фильмы');
    const collections = element('section', 'profile-collections');
    collections.setAttribute('aria-label', 'Мои коллекции');
    const shortcuts = element('div', 'profile-shortcuts');
    const discussions = pageLink('', '/me/discussions', 'profile-shortcut');
    discussions.append(
      element('span', 'film-eyebrow', 'Разговоры о кино'),
      element('h2', '', 'Мои обсуждения'),
      element('p', '', 'Темы, в которых вы участвуете'),
      element('span', '', 'Открыть →'),
    );
    shortcuts.append(discussions);
    const accountActions = element('section', 'profile-account-actions');
    accountActions.setAttribute('aria-label', 'Управление аккаунтом');
    accountActions.append(element('h2', '', 'Аккаунт'));
    const controls = element('div', 'profile-account-actions__buttons');
    const logout = createLogoutButton({
      onClick: () =>
        confirmLogout(logout, () => {
          this.navigate('/profile', { refresh: true });
        }),
    });
    logout.textContent = 'Выйти из аккаунта';
    logout.classList.add('profile-logout');
    controls.append(logout);
    accountActions.append(controls);
    main.append(hero, stats, library, collections, shortcuts, accountActions);
    let catalog = null;
    let disposed = false;
    const valid = () => !disposed && page.isConnected && store.get('user')?.id === user.id;
    const lists = () => ({
      watchlater: getSavedMovieIds('watchlater'),
      favorite: getSavedMovieIds('favorite'),
      watched: readPersonalLibrary().watched,
    });
    const names = { watchlater: 'Смотреть позже', favorite: 'Избранное', watched: 'Просмотрено' };
    const paths = { watchlater: '/watch-later', favorite: '/favorites', watched: '/watched' };
    const renderMovies = () => {
      if (!catalog) return;
      const saved = lists();
      const byID = new Map(catalog.map((movie) => [movie.id, movie]));
      library.replaceChildren();
      for (const [key, label] of Object.entries(names)) {
        const section = element('section', 'profile-film-list');
        section.dataset.list = key;
        section.append(sectionHead(`${label} · ${saved[key].length}`, 'Весь список →', paths[key]));
        const chosen = saved[key].map((id) => byID.get(id)).filter(Boolean);
        if (!chosen.length)
          section.append(
            emptyState(
              'Здесь будет ваше кино',
              'Добавляйте фильмы через кнопки на постерах — они появятся в этом списке.',
            ),
          );
        else {
          const track = element('div', 'people-movie-grid profile-film-track');
          track.append(...chosen.map((movie) => createMovieTile(movie, page)));
          section.append(createScrollRow(track, { label: label.toLowerCase() }));
        }
        library.append(section);
      }
      library.removeAttribute('aria-busy');
      library.removeAttribute('aria-label');
    };
    const renderCollections = () => {
      if (!catalog) return;
      const data = readPersonalLibrary();
      collections.replaceChildren(
        sectionHead('Мои коллекции', 'Все коллекции →', '/my-collections'),
      );
      if (!data.collections.length) {
        collections.append(
          emptyState(
            'Соберите первую коллекцию',
            'Объединяйте фильмы по настроению, героям или собственным правилам.',
            '/my-collections',
            'Перейти к коллекциям',
          ),
        );
        return;
      }
      const byID = new Map(catalog.map((movie) => [movie.id, movie]));
      const grid = element('div', 'profile-collection-grid');
      for (const item of data.collections.slice(0, 3)) {
        const link = pageLink(
          '',
          `/my-collections?id=${encodeURIComponent(item.id)}`,
          'profile-collection-card',
        );
        const films = item.filmIds.map((id) => byID.get(id)).filter(Boolean);
        link.append(
          element('span', 'film-eyebrow', filmCount(item.filmIds.length)),
          element('h3', '', item.name),
        );
        if (films.length) link.append(createPosterStack(films));
        else link.append(element('span', 'profile-collection-empty', 'Пока без фильмов'));
        grid.append(link);
      }
      collections.append(grid);
    };
    const refresh = () => {
      if (!store.get('user')) {
        guest();
        return;
      }
      const data = readPersonalLibrary();
      const saved = lists();
      stats.replaceChildren();
      for (const [label, count, href] of [
        ['Просмотрено', data.watched.length, '/watched'],
        ['Избранное', saved.favorite.length, '/favorites'],
        ['Смотреть позже', saved.watchlater.length, '/watch-later'],
        ['Коллекции', data.collections.length, '/my-collections'],
      ]) {
        const link = pageLink('', href, 'profile-stat');
        link.append(element('strong', '', String(count)), element('span', '', label));
        stats.append(link);
      }
      renderMovies();
      renderCollections();
    };
    const load = async () => {
      library.classList.remove('discussion-load-error');
      skeletons(library, 1);
      try {
        catalog = await getCatalog();
        if (valid()) refresh();
      } catch {
        if (valid()) showRetry(library, 'Не удалось загрузить вашу библиотеку.', load);
      }
    };
    refresh();
    void load();
    void loadPersonalLibrary()
      .then(() => {
        if (valid()) refresh();
      })
      .catch((error) => {
        if (!disposed && page.isConnected && error.authRequired) {
          refresh();
          page.dispatchEvent(new CustomEvent('personallibrarychange'));
        }
      });
    page.addEventListener('movielistchange', refresh);
    page.addEventListener('personallibrarychange', refresh);
    window.addEventListener('storage', refresh);
    onPageRemoved(page, () => {
      disposed = true;
      window.removeEventListener('storage', refresh);
      page.removeEventListener('movielistchange', refresh);
      page.removeEventListener('personallibrarychange', refresh);
    });
    return page;
  }
}
