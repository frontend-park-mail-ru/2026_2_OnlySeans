import { logout } from '../../../services/auth.js';

export const confirmLogout = (trigger, onLoggedOut) => {
  if (document.querySelector('.logout-confirm')) return;
  const dialog = document.createElement('dialog');dialog.className = 'personal-library-dialog logout-confirm';
  dialog.setAttribute('aria-labelledby', 'logout-confirm-title');dialog.setAttribute('aria-describedby', 'logout-confirm-description');
  dialog.innerHTML = '<h2 id="logout-confirm-title">Выйти из аккаунта?</h2><p id="logout-confirm-description" class="personal-library-hint">Вы останетесь на текущей странице.</p><p class="personal-library-status" role="alert"></p><div class="personal-collection-controls"><button type="button" data-cancel>Остаться</button><button type="button" data-confirm>Выйти</button></div>';
  let busy = false;
  const cancel = dialog.querySelector('[data-cancel]'), confirm = dialog.querySelector('[data-confirm]');
  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog || busy) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    const target = trigger.isConnected ? trigger : document.querySelector('.site-header__login');
    target?.focus({ preventScroll: true });
  }, { once: true });
  confirm.addEventListener('click', async () => {
    if (busy) return;busy = true;cancel.disabled = true;confirm.disabled = true;
    const status = dialog.querySelector('[role=alert]');status.textContent = '';confirm.textContent = 'Выходим…';
    try {
      if (!await logout()) { status.textContent = 'Не удалось выйти из аккаунта. Попробуйте ещё раз.';return; }
      dialog.close();onLoggedOut();
    } catch { status.textContent = 'Не удалось связаться с сервером. Попробуйте ещё раз.'; }
    finally { busy = false;cancel.disabled = false;confirm.disabled = false;confirm.textContent = 'Выйти'; }
  });
  (trigger.closest('.catalog-page') || document.body).append(dialog);dialog.showModal();cancel.focus();
};
