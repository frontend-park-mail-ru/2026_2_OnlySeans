import './profile-page.css';
import templateSource from './ProfilePage.hbs';
import { Component, requireElement } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { store } from '../../core/store.js';
import { changePassword, getProfile, updateProfile } from '../../api/profile.js';
import { checkEmail, checkUsername, checkNewPassword } from '../../services/validation.js';
import {
  libraryLoaded,
  loadLibrary,
  readLibrary,
  waitForFavorites,
  watchLibrary,
} from '../../services/library.js';
import { saveAvatar, clearAvatar } from '../../services/avatar.js';
import { logout } from '../../services/session.js';
import { saveOfflineAccount } from '../../services/offline-storage.js';
import { notify } from '../../services/notice.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { renderProfileLibrary } from './profile-library.js';
import { loadCatalog } from '../../services/catalog.js';
import { favoriteShare, favoriteStats } from '../../services/favorites.js';
import { FavoriteShare } from '../favorites/FavoriteShare.js';
import { MovieGrid } from '../../components/movie-grid/MovieGrid.js';
import { ReviewCard } from '../film/reviews/card/ReviewCard.js';
import { loadProfileReviews } from '../../services/profile-reviews.js';
import type { Modal } from '../../components/modal/Modal.js';
import type { Account } from '../../services/offline-storage.js';
import {
  readProfileBio,
  saveProfileBio,
  readProfileGenres,
  saveProfileGenres,
} from '../../services/profile-bio.js';
import {
  readContentPreferences,
  saveContentPreferences,
} from '../../services/content-preferences.js';

const template = await loadAssets({ template: templateSource });

export class ProfilePage extends Component {
  static template = template;
  #dialog: Modal | null = null;
  #reviewCards: ReviewCard[] = [];

  onRender() {
    this.#reviewCards = [];
    document.title = 'Мой профиль | Frame';
    const page = this.element;
    const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
      requireElement<T>(page, selector);
    const sessionUser = store.get('user');
    if (!sessionUser) return;
    let user: Account = sessionUser;
    this.on(
      'click',
      async () => {
        if (!(await ConfirmDialog.ask({ title: 'Выйти из аккаунта?', confirmText: 'Выйти' })))
          return;
        try {
          await logout();
          this.props.navigate('/');
        } catch {
          notify('Не удалось выйти. Попробуйте ещё раз.', { type: 'error' });
        }
      },
      this.find('[data-profile-logout]'),
    );

    const editButton = find<HTMLButtonElement>('[data-profile-edit]');
    const profileView = find<HTMLElement>('[data-profile-view]');
    const profileForm = find<HTMLFormElement>('[data-profile-form]');
    const cancelButton = find<HTMLButtonElement>('[data-profile-cancel]');
    const usernameInput = find<HTMLInputElement>('#profile-username');
    const emailInput = find<HTMLInputElement>('#profile-email');
    const biographyInput = find<HTMLTextAreaElement>('#profile-bio');
    biographyInput.style.resize = 'vertical';
    let biography = readProfileBio();
    let savedGenres = readProfileGenres();
    const draftGenres = new Set(savedGenres);
    const hideAdultsInput = find<HTMLInputElement>('[data-profile-hide-adults]');
    let hideAdults = readContentPreferences().hideAdults;
    hideAdultsInput.checked = hideAdults;
    biographyInput.value = biography;
    find('[data-profile-bio]').textContent = biography;
    const avatarInput = find<HTMLInputElement>('#profile-avatar');
    const avatarImage = find<HTMLImageElement>('[data-profile-avatar-image]');
    const avatarPlaceholder = find<HTMLElement>('[data-profile-avatar-placeholder]');
    const profileStatus = find('[data-profile-status]');
    const saveButton = requireElement<HTMLButtonElement>(profileForm, 'button[type="submit"]');
    const passwordForm = find<HTMLFormElement>('[data-profile-password]');
    const passwordDialog = find<HTMLDialogElement>('[data-password-dialog]');
    const currentPassword = find<HTMLInputElement>('#profile-current-password');
    const newPassword = find<HTMLInputElement>('#profile-new-password');
    const repeatPassword = find<HTMLInputElement>('#profile-repeat-password');
    const passwordButton = requireElement<HTMLButtonElement>(passwordForm, 'button[type="submit"]');
    const passwordStatus = find('[data-profile-password-status]');
    const fileHint = find('#profile-avatar-hint');
    const defaultFileHint = fileHint.textContent;
    const removePhoto = find<HTMLButtonElement>('[data-profile-remove-photo]');
    const photoControl = find('.profile-page__photo-control');
    const avatar = find('.profile-page__avatar');
    const profileContent = find('.profile-page__content');
    const controls = [
      usernameInput,
      emailInput,
      biographyInput,
      avatarInput,
      cancelButton,
      removePhoto,
      hideAdultsInput,
      ...passwordForm.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button'),
    ];
    let busy = false;
    let croppedFile: File | null = null;
    let previewURL = '';
    this.watch(() => URL.revokeObjectURL(previewURL));

    function showStatus(element: HTMLElement, message = '', kind = '') {
      element.textContent = message;
      element.dataset.state = kind;
    }

    function fieldError(input: HTMLInputElement | HTMLTextAreaElement, message = '') {
      const target = find('#' + input.id + '-error');
      target.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }

    function showIdentity() {
      find('[data-profile-username]').textContent = user.username;
      find('[data-profile-email]').textContent = user.email;
      find('[data-profile-security-email]').textContent = user.email;

      avatarPlaceholder.textContent = Array.from(user.username)[0]?.toUpperCase() || '—';
    }

    function editedIdentity() {
      return usernameInput.value.trim() !== user.username || emailInput.value.trim() !== user.email;
    }

    function syncControls() {
      for (const control of controls) control.disabled = busy;
      for (const button of page.querySelectorAll<HTMLButtonElement>('[data-profile-genre]'))
        button.disabled = busy;
      saveButton.disabled =
        busy ||
        (!editedIdentity() &&
          !croppedFile &&
          biographyInput.value.trim() === biography &&
          JSON.stringify([...draftGenres].sort()) === JSON.stringify([...savedGenres].sort()) &&
          hideAdultsInput.checked === hideAdults);
      find('[data-profile-bio-count]').textContent = `${[...biographyInput.value].length} / 160`;
      passwordButton.disabled =
        busy || ![currentPassword, newPassword, repeatPassword].some((input) => input.value);
    }

    function resetPhotoError() {
      photoControl.removeAttribute('data-invalid');
      fileHint.textContent = defaultFileHint;
      requireElement(photoControl, ':scope > span').textContent = 'Сменить фото';
    }

    function setPhotoError(message: string) {
      photoControl.setAttribute('data-invalid', '');
      requireElement(photoControl, ':scope > span').textContent = 'Не подошло';
      fileHint.textContent = message;
    }

    function setEditMode(editing: boolean) {
      (editing ? photoControl : profileContent).prepend(avatar);
      page.dataset.editing = String(editing);
      profileView.hidden = editing;
      profileForm.hidden = !editing;
      if (editing) {
        usernameInput.value = user.username;
        emailInput.value = user.email;
        biographyInput.value = biography;
      } else {
        avatarInput.value = '';
        croppedFile = null;
        resetPhotoError();
        passwordForm.reset();
        for (const input of [currentPassword, newPassword, repeatPassword]) input.type = 'password';
        for (const toggle of passwordForm.querySelectorAll<HTMLButtonElement>(
          '[data-password-toggle]',
        )) {
          toggle.setAttribute('aria-pressed', 'false');
          toggle.setAttribute('aria-label', 'Показать пароль');
        }
      }
      for (const input of [usernameInput, emailInput, currentPassword, newPassword, repeatPassword])
        fieldError(input);
      showStatus(profileStatus);
      showStatus(passwordStatus);
      updatePasswordRules();
      syncControls();
    }

    function updatePasswordRules() {
      const password = newPassword.value;
      const rules = [
        password.length >= 8 && password.length <= 32,
        /[A-Z]/.test(password),
        /\d/.test(password),
      ];
      page.querySelectorAll('.profile-page__password-rules li').forEach((rule, index) => {
        rule.classList.toggle('is-met', rules[index]);
      });
    }

    showIdentity();
    const showMobileCounts = () => {
      const library = readLibrary();
      for (const node of this.findAll<HTMLElement>('[data-profile-mobile-count]')) {
        const list = node.dataset.profileMobileCount as keyof typeof library;
        node.textContent = libraryLoaded() ? String(library[list].length) : '—';
      }
    };
    showMobileCounts();
    this.watch(
      watchLibrary((library) => {
        showMobileCounts();
        find('[data-profile-favorite-total]').textContent = String(library.favorite.length);
        find('[data-profile-watched-total]').textContent = String(library.watched.length);
        find('[data-profile-watched-mobile]').textContent = String(library.watched.length);
        find('[data-profile-later-total]').textContent = String(library.watchlater.length);
      }),
    );

    avatarInput.addEventListener('change', async () => {
      resetPhotoError();
      showStatus(profileStatus);
      const file = avatarInput.files?.[0];
      if (
        file &&
        (file.size === 0 ||
          file.size > 5 * 1024 * 1024 ||
          !['image/jpeg', 'image/png'].includes(file.type))
      ) {
        avatarInput.value = '';
        setPhotoError('Подойдёт PNG или JPEG до 5 МБ');
      } else if (file) {
        avatarInput.value = '';
        try {
          const { AvatarCropper } = await import('./AvatarCropper.js');
          if (this.destroyed || store.get('user')?.id !== user.id) return;
          this.#dialog = new AvatarCropper({
            file,
            onApply: (result: File) => {
              if (this.destroyed || store.get('user')?.id !== user.id) return;
              croppedFile = result;
              URL.revokeObjectURL(previewURL);
              previewURL = URL.createObjectURL(result);
              showAvatar(previewURL);
              fileHint.textContent = 'Фото подготовлено. Нажмите «Сохранить».';
              syncControls();
            },
          }).open();
        } catch {
          if (!this.destroyed)
            setPhotoError('Не удалось открыть редактор фото. Повторите попытку.');
        }
      }
      syncControls();
    });

    for (const input of [usernameInput, emailInput]) {
      input.addEventListener('input', () => {
        fieldError(input);
        showStatus(profileStatus);
        syncControls();
      });
    }
    this.on(
      'input',
      () => {
        fieldError(
          biographyInput,
          [...biographyInput.value.trim()].length > 160 ? 'Максимум 160 символов' : '',
        );
        syncControls();
      },
      biographyInput,
    );
    editButton.addEventListener('click', () => {
      if (!navigator.onLine) {
        notify('Чтобы изменить данные профиля, подключитесь к сети.');
        return;
      }
      this.props.navigate('/profile?edit=1');
    });
    cancelButton.addEventListener('click', () => this.props.navigate('/profile'));

    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy || saveButton.disabled) return;
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const nameError = checkUsername(username);
      const emailError = checkEmail(email);
      fieldError(usernameInput, nameError);
      fieldError(emailInput, emailError);
      const biographyError =
        [...biographyInput.value.trim()].length > 160 ? 'Максимум 160 символов' : '';
      fieldError(biographyInput, biographyError);
      if (nameError || emailError || biographyError) return;

      const file = croppedFile;
      let identitySaved = false;
      busy = true;
      syncControls();
      showStatus(profileStatus);
      saveButton.textContent = 'Сохраняем…';
      try {
        if (editedIdentity()) {
          const updated = (await updateProfile(username, email)).user;
          if (store.get('user')?.id === updated.id) {
            saveOfflineAccount(updated);
            store.set({ user: updated });
          }
          user = updated;
          showIdentity();
          identitySaved = true;
        }
        if (file) {
          if (store.get('user')?.id !== user.id) return;
          await saveAvatar(file);
          croppedFile = null;
          avatarInput.value = '';
        }
        if (biographyInput.value.trim() !== biography) {
          if (store.get('user')?.id !== user.id) return;
          saveProfileBio(biographyInput.value);
          biography = readProfileBio();
          find('[data-profile-bio]').textContent = biography;
        }
        if (store.get('user')?.id !== user.id) return;
        if (JSON.stringify([...draftGenres].sort()) !== JSON.stringify([...savedGenres].sort())) {
          saveProfileGenres([...draftGenres]);
          savedGenres = readProfileGenres();
        }
        if (hideAdultsInput.checked !== hideAdults) {
          if (!saveContentPreferences({ hideAdults: hideAdultsInput.checked }))
            throw new Error('Не удалось сохранить настройку контента');
          hideAdults = hideAdultsInput.checked;
        }
        showStatus(profileStatus, 'Данные профиля сохранены', 'success');
      } catch (error) {
        if (error.message === 'username taken') fieldError(usernameInput, 'Это имя уже занято');
        else if (error.message === 'email taken')
          fieldError(emailInput, 'Этот email уже используется');
        else {
          if (
            file &&
            (identitySaved || !editedIdentity()) &&
            (error.status === 400 || error.status === 413)
          ) {
            avatarInput.value = '';
            setPhotoError('Не удалось принять фото. Выберите PNG или JPEG до 5 МБ.');
          }
          showStatus(
            profileStatus,
            identitySaved
              ? 'Часть изменений сохранена. Повторите сохранение оставшихся.'
              : 'Не удалось сохранить. Попробуйте ещё раз.',
            'error',
          );
        }
      } finally {
        busy = false;
        saveButton.textContent = 'Сохранить';
        syncControls();
      }
    });

    for (const input of [currentPassword, newPassword, repeatPassword]) {
      input.addEventListener('input', () => {
        fieldError(input);
        showStatus(passwordStatus);
        updatePasswordRules();
        syncControls();
      });
    }
    for (const toggle of passwordForm.querySelectorAll<HTMLButtonElement>(
      '[data-password-toggle]',
    )) {
      toggle.addEventListener('click', () => {
        const input = find<HTMLInputElement>('#' + toggle.dataset.passwordToggle);
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        toggle.setAttribute('aria-pressed', String(visible));
        toggle.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
      });
    }
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy || passwordButton.disabled) return;
      const current = currentPassword.value;
      const next = newPassword.value;
      const currentError = current ? '' : 'Введите текущий пароль';
      const newError =
        checkNewPassword(next) ||
        (next === current ? 'Новый пароль должен отличаться от текущего' : '');
      const repeatError = next && repeatPassword.value === next ? '' : 'Пароли не совпадают';
      fieldError(currentPassword, currentError);
      fieldError(newPassword, newError);
      fieldError(repeatPassword, repeatError);
      if (currentError || newError || repeatError) return;

      busy = true;
      syncControls();
      passwordButton.textContent = 'Обновляем…';
      showStatus(passwordStatus);
      try {
        await changePassword(current, next);
        passwordForm.reset();
        updatePasswordRules();
        showStatus(passwordStatus, 'Пароль обновлён', 'success');
      } catch (error) {
        if (error.message === 'wrong current password')
          fieldError(currentPassword, 'Неверный текущий пароль');
        else showStatus(passwordStatus, 'Не удалось обновить пароль. Попробуйте ещё раз.', 'error');
      } finally {
        busy = false;
        passwordButton.textContent = 'Обновить пароль';
        syncControls();
      }
    });

    avatarImage.addEventListener('load', () => {
      avatarImage.hidden = false;
      avatarPlaceholder.hidden = true;
    });
    avatarImage.addEventListener('error', () => {
      avatarImage.hidden = true;
      avatarPlaceholder.hidden = false;
    });

    function showAvatar(url: string) {
      removePhoto.hidden = !url && !croppedFile;
      if (url) avatarImage.src = url;
      else {
        avatarImage.removeAttribute('src');
        avatarImage.hidden = true;
        avatarPlaceholder.hidden = false;
      }
    }
    this.delegate('click', '[data-profile-remove-photo]', () => {
      if (busy) return;
      if (croppedFile) {
        croppedFile = null;
        showAvatar(store.get('avatarUrl'));
        syncControls();
        return;
      }
      this.#dialog = new ConfirmDialog({
        title: 'Удалить фото профиля?',
        text: 'Вместо фотографии будет показана первая буква имени.',
        confirmText: 'Удалить фото',
        cancelText: 'Отмена',
        danger: true,
        resolve: async (confirmed: boolean) => {
          if (!confirmed || this.destroyed || store.get('user')?.id !== user.id) return;
          busy = true;
          syncControls();
          try {
            await clearAvatar();
            if (!this.destroyed && store.get('user')?.id === user.id)
              showStatus(profileStatus, 'Фото профиля удалено', 'success');
          } catch {
            if (!this.destroyed)
              showStatus(profileStatus, 'Не удалось удалить фото. Повторите попытку.', 'error');
          } finally {
            busy = false;
            if (!this.destroyed) syncControls();
          }
        },
      }).open();
    });
    this.watch(store.watch('avatarUrl', showAvatar));
    showAvatar(store.get('avatarUrl'));

    setEditMode(this.props.query.get('edit') === '1');
    const setTab = (tab: string) => {
      const security = tab === 'security';
      passwordForm.hidden = true;
      find('[data-profile-security-info]').hidden = !security;
      profileForm.hidden = security;
      this.findAll<HTMLElement>('[data-profile-tab]').forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.profileTab === tab)),
      );
    };
    this.delegate('click', '[data-profile-tab]', (_, button) =>
      setTab(button.dataset.profileTab || 'main'),
    );
    if (this.props.query.get('edit') === '1')
      setTab(this.props.query.get('section') === 'security' ? 'security' : 'main');
    this.delegate('click', '[data-password-open]', () => {
      passwordForm.hidden = false;
      passwordDialog.showModal();
    });
    this.delegate('click', '[data-password-close]', () => passwordDialog.close());
    this.on(
      'close',
      () => {
        passwordForm.hidden = true;
      },
      passwordDialog,
    );
    this.delegate('click', '[data-profile-edit-email]', () => {
      setTab('main');
      emailInput.focus();
    });
    this.delegate('click', '[data-profile-security-logout]', () =>
      this.find('[data-profile-logout]').click(),
    );
    page.dataset.section = this.props.query.get('section') || 'overview';
    this.delegate('click', '[data-profile-share]', () => {
      try {
        const ids = readLibrary().favorite;
        favoriteShare(ids);
        this.#dialog = new FavoriteShare({ ids }).open();
      } catch (error) {
        notify(error.message, { type: 'error' });
      }
    });
    this.on('change', syncControls, hideAdultsInput);
    this.delegate('click', '[data-profile-genre]', (_, button) => {
      if (busy) return;
      const genre = button.dataset.profileGenre!;
      if (draftGenres.has(genre)) draftGenres.delete(genre);
      else if (draftGenres.size < 10) draftGenres.add(genre);
      else {
        find('[data-profile-genres-status]').textContent = 'Выберите не больше 10 жанров';
        return;
      }
      find('[data-profile-genres-status]').textContent = '';
      button.setAttribute('aria-pressed', String(draftGenres.has(genre)));
      syncControls();
    });
    this.delegate('click', '[data-profile-retry]', () => this.update());
    waitForFavorites()
      .then(async () => {
        if (!libraryLoaded()) await loadLibrary();
        return getProfile();
      })
      .then((data) => {
        if (this.destroyed || this.element !== page || store.get('user')?.id !== user.id) return;
        renderProfileLibrary(page, data);
        const controller = new AbortController();
        this.watch(() => controller.abort());
        let loadingReviews = false;
        const renderExtra = async () => {
          const films = await loadCatalog({ signal: controller.signal });
          if (controller.signal.aborted || this.destroyed || store.get('user')?.id !== user.id)
            return;
          const byId = new Map(films.map((film) => [film.id, film]));
          const library = readLibrary();
          const genreHost = find('[data-profile-genres]');
          genreHost.replaceChildren();
          const genres = [
            ...new Set([...draftGenres, ...films.flatMap((film) => film.genres)]),
          ].sort((a, b) => a.localeCompare(b, 'ru'));
          for (const genre of genres) {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.profileGenre = genre;
            button.textContent = genre;
            button.setAttribute('aria-pressed', String(draftGenres.has(genre)));
            button.disabled = busy;
            genreHost.append(button);
          }
          const watched = library.watched
            .map((id) => byId.get(id))
            .filter((film) => film !== undefined);
          const later = library.watchlater
            .map((id) => byId.get(id))
            .filter((film) => film !== undefined);
          find('[data-profile-hours]').textContent =
            favoriteStats(watched).hours?.toLocaleString('ru') ?? '—';
          this.insert(
            find('[data-profile-recent-grid]'),
            new MovieGrid({ films: watched.slice(0, 5), view: 'grid' }),
          );
          this.insert(
            find('[data-profile-later-grid]'),
            new MovieGrid({ films: later.slice(0, 5), view: 'grid' }),
          );
          if (!watched.length)
            find('[data-profile-recent-grid]').textContent =
              'Отмечайте просмотренное на карточках фильмов.';
          if (!later.length)
            find('[data-profile-later-grid]').textContent =
              'Добавьте фильмы, которые хотите посмотреть.';
          const loadReviews = async () => {
            if (loadingReviews) return;
            loadingReviews = true;
            const button = find<HTMLButtonElement>('[data-profile-load-reviews]');
            button.disabled = true;
            const status = find('[data-profile-reviews-status]');
            try {
              const priorities = new Set(data.ratings.map((film) => film.id));
              const candidates = [
                ...films.filter((film) => priorities.has(film.id)),
                ...films.filter((film) => !priorities.has(film.id)),
              ];
              const expected =
                this.props.query.get('section') === 'reviews'
                  ? data.reviews
                  : Math.min(data.reviews, 1);
              const result = await loadProfileReviews(candidates, user.id, expected, {
                signal: controller.signal,
                onProgress: (checked) => {
                  status.textContent = 'Проверено фильмов: ' + checked + ' из ' + candidates.length;
                },
              });
              if (controller.signal.aborted || store.get('user')?.id !== user.id) return;
              find('[data-profile-reviews-list]').replaceChildren();
              this.#reviewCards.forEach((card) => this.remove(card));
              this.#reviewCards = [];
              result.reviews.forEach(({ film, review }) => {
                const section = document.createElement('article');
                const link = document.createElement('a');
                link.href = '/film/' + film.id;
                link.dataset.link = '';
                link.textContent = film.title;
                section.append(link);
                find('[data-profile-reviews-list]').append(section);
                this.#reviewCards.push(this.insert(section, new ReviewCard({ review, own: true })));
              });
              status.textContent =
                result.failed || result.reviews.length < expected
                  ? 'Не все отзывы удалось найти. Можно повторить загрузку.'
                  : result.reviews.length
                    ? ''
                    : 'У вас пока нет отзывов.';
            } catch {
              if (!controller.signal.aborted)
                status.textContent = 'Не удалось загрузить отзывы. Повторите попытку.';
            } finally {
              loadingReviews = false;
              button.disabled = false;
            }
          };
          this.on(
            'click',
            () => {
              if (this.props.query.get('section') === 'reviews') void loadReviews();
              else this.props.navigate('/profile?section=reviews');
            },
            find('[data-profile-load-reviews]'),
          );
          if (this.props.query.get('section') !== 'reviews')
            find('[data-profile-load-reviews]').textContent = 'Все ' + data.reviews + ' →';
          if (
            this.props.query.get('edit') !== '1' &&
            (this.props.query.get('section') === 'reviews' ||
              !matchMedia('(max-width:767px)').matches)
          )
            void loadReviews();
        };
        void renderExtra().catch(() => {
          if (!controller.signal.aborted) {
            find('[data-profile-recent-grid]').textContent = 'Не удалось загрузить фильмы.';
            find('[data-profile-later-grid]').textContent = 'Не удалось загрузить фильмы.';
            find('[data-profile-genres-status]').textContent =
              'Не удалось загрузить жанры. Вернитесь в профиль и повторите загрузку.';
            find('[data-profile-library-status]').hidden = false;
            find('[data-profile-library-status]').textContent =
              'Часть данных профиля не загрузилась.';
            find('[data-profile-retry]').hidden = false;
          }
        });
      })
      .catch(() => {
        if (this.destroyed || this.element !== page) return;
        find('[data-profile-library-status]').textContent = 'Не удалось загрузить списки.';
        find('[data-profile-retry]').hidden = false;
      });
  }
  destroy() {
    this.#dialog?.close();
    super.destroy();
  }
}
