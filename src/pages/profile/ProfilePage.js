import './profile-page.css';
import templateSource from './ProfilePage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { store } from '../../core/store.js';
import { changePassword, getProfile, updateProfile } from '../../api/profile.js';
import { checkEmail, checkUsername, checkNewPassword } from '../../services/validation.js';
import { waitForFavorites } from '../../services/library.js';
import { saveAvatar } from '../../services/avatar.js';
import { logout } from '../../services/session.js';
import { notify } from '../../services/notice.js';
import { ConfirmDialog } from '../../components/confirm-dialog/ConfirmDialog.js';
import { renderProfileLibrary } from './profile-library.js';

const template = await loadAssets({ template: templateSource });

export class ProfilePage extends Component {
  static template = template;

  onRender() {
    document.title = 'Мой профиль | Frame';
    const page = this.element;
    let user = store.get('user');
    this.on('click', async () => {
      if (!await ConfirmDialog.ask({ title: 'Выйти из аккаунта?', confirmText: 'Выйти' })) return;
      try {
        await logout();
        this.props.navigate('/');
      } catch {
        notify('Не удалось выйти. Попробуйте ещё раз.', { type: 'error' });
      }
    }, this.find('[data-profile-logout]'));

    const editButton = page.querySelector('[data-profile-edit]');
    const profileView = page.querySelector('[data-profile-view]');
    const profileForm = page.querySelector('[data-profile-form]');
    const cancelButton = page.querySelector('[data-profile-cancel]');
    const usernameInput = page.querySelector('#profile-username');
    const emailInput = page.querySelector('#profile-email');
    const avatarInput = page.querySelector('#profile-avatar');
    const avatarImage = page.querySelector('[data-profile-avatar-image]');
    const avatarPlaceholder = page.querySelector('[data-profile-avatar-placeholder]');
    const profileStatus = page.querySelector('[data-profile-status]');
    const saveButton = profileForm.querySelector('button[type="submit"]');
    const passwordForm = page.querySelector('[data-profile-password]');
    const currentPassword = page.querySelector('#profile-current-password');
    const newPassword = page.querySelector('#profile-new-password');
    const repeatPassword = page.querySelector('#profile-repeat-password');
    const passwordButton = passwordForm.querySelector('button[type="submit"]');
    const passwordStatus = page.querySelector('[data-profile-password-status]');
    const fileHint = page.querySelector('#profile-avatar-hint');
    const defaultFileHint = fileHint.textContent;
    const photoControl = page.querySelector('.profile-page__photo-control');
    const controls = [usernameInput, emailInput, avatarInput, cancelButton, ...passwordForm.elements];
    let busy = false;

    function showStatus(element, message = '', kind = '') {
      element.textContent = message;
      element.dataset.state = kind;
    }

    function fieldError(input, message = '') {
      const target = page.querySelector('#' + input.id + '-error');
      target.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }

    function showIdentity() {
      page.querySelector('[data-profile-username]').textContent = user.username;
      page.querySelector('[data-profile-email]').textContent = user.email;
      page.querySelector('[data-profile-director]').textContent = user.username;
      avatarPlaceholder.textContent = Array.from(user.username)[0]?.toUpperCase() || '—';
    }

    function editedIdentity() {
      return usernameInput.value.trim() !== user.username || emailInput.value.trim() !== user.email;
    }

    function syncControls() {
      for (const control of controls) control.disabled = busy;
      saveButton.disabled = busy || (!editedIdentity() && !avatarInput.files.length);
      passwordButton.disabled = busy || ![currentPassword, newPassword, repeatPassword].some(input => input.value);
    }

    function resetPhotoError() {
      photoControl.removeAttribute('data-invalid');
      fileHint.textContent = defaultFileHint;
      photoControl.querySelector('span').textContent = 'Сменить фото';
    }

    function setPhotoError(message) {
      photoControl.setAttribute('data-invalid', '');
      photoControl.querySelector('span').textContent = 'Не подошло';
      fileHint.textContent = message;
    }

    function setEditMode(editing) {
      profileView.hidden = editing;
      profileForm.hidden = !editing;
      if (editing) {
        usernameInput.value = user.username;
        emailInput.value = user.email;
      } else {
        avatarInput.value = '';
        resetPhotoError();
        passwordForm.reset();
        for (const input of [currentPassword, newPassword, repeatPassword]) input.type = 'password';
        for (const toggle of passwordForm.querySelectorAll('[data-password-toggle]')) {
          toggle.setAttribute('aria-pressed', 'false');
          toggle.setAttribute('aria-label', 'Показать пароль');
        }
      }
      for (const input of [usernameInput, emailInput, currentPassword, newPassword, repeatPassword]) fieldError(input);
      showStatus(profileStatus);
      showStatus(passwordStatus);
      updatePasswordRules();
      syncControls();
    }

    function updatePasswordRules() {
      const password = newPassword.value;
      const rules = [password.length >= 8 && password.length <= 32, /[A-Z]/.test(password), /\d/.test(password)];
      page.querySelectorAll('.profile-page__password-rules li').forEach((rule, index) => {
        rule.classList.toggle('is-met', rules[index]);
      });
    }

    showIdentity();

    avatarInput.addEventListener('change', () => {
      resetPhotoError();
      showStatus(profileStatus);
      const file = avatarInput.files[0];
      if (file && (file.size === 0 || file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type))) {
        avatarInput.value = '';
        setPhotoError('Подойдёт PNG или JPEG до 5 МБ');
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
    editButton.addEventListener('click', () => this.props.navigate('/profile?edit=1'));
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
      if (nameError || emailError) return;

      const file = avatarInput.files[0];
      let identitySaved = false;
      busy = true;
      syncControls();
      showStatus(profileStatus);
      saveButton.textContent = 'Сохраняем…';
      try {
        if (editedIdentity()) {
          const updated = (await updateProfile(username, email)).user;
          if (store.get('user')?.id === updated.id) store.set({ user: updated });
          user = updated;
          showIdentity();
          identitySaved = true;
        }
        if (file) {
          if (store.get('user')?.id !== user.id) return;
          await saveAvatar(file);
          avatarInput.value = '';
        }
        showStatus(profileStatus, 'Данные профиля сохранены', 'success');
      } catch (error) {
        if (error.message === 'username taken') fieldError(usernameInput, 'Это имя уже занято');
        else if (error.message === 'email taken') fieldError(emailInput, 'Этот email уже используется');
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
              ? 'Данные сохранены, но фото не загрузилось.'
              : 'Не удалось сохранить. Попробуйте ещё раз.',
            'error'
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
    for (const toggle of passwordForm.querySelectorAll('[data-password-toggle]')) {
      toggle.addEventListener('click', () => {
        const input = page.querySelector('#' + toggle.dataset.passwordToggle);
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
      const newError = checkNewPassword(next) ||
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
        if (error.message === 'wrong current password') fieldError(currentPassword, 'Неверный текущий пароль');
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

    function showAvatar(url) {
      if (url) avatarImage.src = url;
    }
    this.watch(store.watch('avatarUrl', showAvatar));
    showAvatar(store.get('avatarUrl'));

    setEditMode(this.props.query.get('edit') === '1');
    waitForFavorites().then(getProfile).then(data => {
      if (this.element === page) renderProfileLibrary(page, data);
    }).catch(() => {
      if (this.element !== page) return;
      page.querySelector('[data-profile-library-status]').textContent = 'Не удалось загрузить списки. Обновите страницу.';
    });
  }
}
