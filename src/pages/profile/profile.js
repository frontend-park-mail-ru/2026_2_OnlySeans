import { BaseComponent } from '../../components/ui/base-component.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { createButton } from '../../components/ui/button/button.js';
import { createField } from '../../components/ui/field/field.js';
import { createLogoutButton } from '../../components/ui/logout-button/logout-button.js';
import { createFilmGrid } from '../../components/ui/film-tile/film-tile.js';
import { getMovies } from '../../api/movies.js';
import { store } from '../../modules/store.js';
import { logout } from '../../services/auth.js';
import { LISTS, getList, getProfile, pickFromList, saveProfile } from '../../services/library.js';

const FIELDS = [
  { id: 'firstName', label: 'Имя' },
  { id: 'birthDate', label: 'Дата рождения', type: 'date' },
  { id: 'gender', label: 'Пол' },
  { id: 'bio', label: 'О себе' },
];

const template = window.Handlebars.compile(`
  <div class="profile">
    <div class="profile__top">
      <section class="profile-card">
        <div class="profile-card__head">
          <span class="profile-card__avatar" aria-hidden="true">{{letter}}</span>
          <div>
            <h1 class="profile-card__name">{{username}}</h1>
            <p class="profile-card__email">{{email}}</p>
          </div>
        </div>
        <div class="profile-card__stats">
          <p><strong>{{favorites}}</strong> в избранном</p>
          <p><strong>{{watchlist}}</strong> буду смотреть</p>
        </div>
        <div class="profile-card__actions"></div>
        <p class="profile-card__status" role="status"></p>
      </section>
      <section>
        <h2 class="film__heading">Личные данные</h2>
        <form class="profile__form" novalidate></form>
        <p class="profile__saved" role="status"></p>
      </section>
    </div>
    <h2 class="section-title">Избранное</h2>
    <p class="page-status" role="status">Загружаем избранное…</p>
    <div class="profile__favorites"></div>
  </div>
`);

export class ProfilePage extends BaseComponent {
  constructor({ navigate }) {
    const user = store.get('user') || {};
    const username = user.username || user.email || 'Пользователь';

    super(template, {
      username,
      email: user.email,
      letter: username.charAt(0).toUpperCase(),
      favorites: getList(LISTS.FAVORITES).length,
      watchlist: getList(LISTS.WATCHLIST).length,
    });
    this.navigate = navigate;
  }

  render() {
    document.title = 'Профиль — Frame';

    const content = this.create();
    this.addLogout(content);
    this.addForm(content);
    loadData(content, getMovies(), (movies) => {
      const favorites = pickFromList(LISTS.FAVORITES, movies);
      content.querySelector('.page-status').textContent = favorites.length ? '' : 'В избранном пока пусто.';
      content.querySelector('.profile__favorites').replaceChildren(createFilmGrid(favorites));
    });

    return createPageShell({ navigate: this.navigate, content });
  }

  addLogout(content) {
    const status = content.querySelector('.profile-card__status');
    const button = createLogoutButton({
      onClick: async () => {
        button.disabled = true;

        try {
          if (await logout()) {
            this.navigate('/login');
            return;
          }
          status.textContent = 'Не удалось выйти из аккаунта. Попробуйте ещё раз.';
        } catch {
          status.textContent = 'Не удалось связаться с сервером. Попробуйте ещё раз.';
        }
        button.disabled = false;
      },
    });

    content.querySelector('.profile-card__actions').appendChild(button);
  }

  addForm(content) {
    const form = content.querySelector('.profile__form');
    const saved = content.querySelector('.profile__saved');
    const profile = getProfile();

    FIELDS.forEach((field) => {
      const element = createField({ ...field, required: false });
      element.querySelector('input').value = profile[field.id] || '';
      form.appendChild(element);
    });
    form.appendChild(createButton({ text: 'Сохранить', type: 'submit' }));

    form.addEventListener('input', () => {
      saved.textContent = '';
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveProfile(Object.fromEntries(new FormData(form)));
      saved.textContent = 'Сохранено';
    });
  }
}
