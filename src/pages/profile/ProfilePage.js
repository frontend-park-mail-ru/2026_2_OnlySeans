import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { readLibrary, watchLibrary } from '../../services/library.js';
import { filmsByIds } from '../../services/catalog.js';
import { displayName, logout } from '../../services/session.js';
import { notify } from '../../services/notice.js';
import { loadInto } from '../../components/status-message/load-into.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { ProfileShelf } from './ProfileShelf.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./profile-page.css', import.meta.url));
const template = await loadTemplate(new URL('./ProfilePage.hbs', import.meta.url));

const SHELVES = [
  { list: 'watchlater', title: 'Смотреть позже', href: '/watch-later' },
  { list: 'favorite', title: 'Избранное', href: '/favorites' },
  { list: 'watched', title: 'Просмотрено', href: '/watched' },
];

function maskEmail(email = '') {
  const [name, domain] = email.split('@');
  if (!domain) return '';
  const visible = name.length > 4 ? `${name.slice(0, 2)}***${name.slice(-2)}` : `${name[0]}***`;
  return `${visible}@${domain}`;
}

export class ProfilePage extends Component {
  static template = template;

  context() {
    const user = store.get('user');
    const library = readLibrary();
    const stats = [
      { label: 'Просмотрено', value: library.watched.length, href: '/watched' },
      { label: 'Избранное', value: library.favorite.length, href: '/favorites' },
      { label: 'Смотреть позже', value: library.watchlater.length, href: '/watch-later' },
    ];
    return { name: displayName(user), email: maskEmail(user?.email), stats };
  }

  onRender() {
    document.title = 'Мой профиль | Frame';
    this.watch(watchLibrary(() => this.update()));
    this.on('click', () => this.#logout(), this.find('.profile-page__logout'));
    this.#load();
  }

  #load() {
    const library = readLibrary();
    const shelves = this.find('.profile-page__shelves');
    loadInto(this, shelves, {
      loading: 'Загружаем ваше кино...',
      load: () => Promise.all(SHELVES.map(({ list }) => filmsByIds(library[list]))),
      render: (lists) => {
        SHELVES.forEach((shelf, index) =>
          this.insert(shelves, new ProfileShelf({ ...shelf, films: lists[index] })),
        );
      },
      failure: () => 'Не удалось загрузить фильмы.',
    });
  }

  async #logout() {
    const confirmed = await ConfirmDialog.ask({
      title: 'Выйти из аккаунта?',
      confirmText: 'Выйти',
    });
    if (!confirmed) return;
    try {
      await logout();
      this.props.navigate('/');
    } catch {
      notify('Не удалось выйти. Попробуйте ещё раз.', { type: 'error' });
    }
  }
}
