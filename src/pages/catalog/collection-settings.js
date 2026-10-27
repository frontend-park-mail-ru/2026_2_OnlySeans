import { renamePersonalCollection, deletePersonalCollection } from '../../services/personal-library.js';
import { collectionShareUrl } from '../../services/collection-sharing.js';
import { limitTextInput } from '../../utils/text-limit.js';

export const createCollectionSettings = (item, page, onChange, { gear = false } = {}) => {
  const trigger = document.createElement('button');trigger.type = 'button';trigger.className = 'collection-settings-trigger';trigger.dataset.collectionSettings = item.id;
  trigger.setAttribute('aria-label', `Настройки коллекции «${item.name}»`);trigger.setAttribute('aria-haspopup', 'menu');trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
  if (gear) trigger.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 3-.6 2.4-2.1 1.2L4 6l-2 3.5 1.8 1.7v2L2 15l2 3.5 2.3-.6 2.1 1.2L9 21h6l.6-2.4 2.1-1.2 2.3.6 2-3.5-1.8-1.7v-2L22 9l-2-3.5-2.3.6-2.1-1.2L15 3Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const menu = document.createElement('div');menu.className = 'collection-settings-menu';menu.id = `collection-menu-${item.id}`;menu.setAttribute('popover', 'auto');menu.setAttribute('role', 'menu');menu.setAttribute('aria-label', `Действия с коллекцией «${item.name}»`);
  trigger.setAttribute('aria-controls', menu.id);
  const openDialog = action => {
    menu.hidePopover();
    const dialog = document.createElement('dialog');dialog.className = 'personal-library-dialog collection-settings-dialog';
    const title = document.createElement('h2');title.id = `collection-action-${item.id}`;title.textContent = { rename: 'Поменять название', share: 'Поделиться коллекцией', delete: 'Удалить коллекцию?' }[action];dialog.setAttribute('aria-labelledby', title.id);
    const description = document.createElement('p');description.className = 'personal-library-hint';description.textContent = action === 'delete' ? `Коллекция «${item.name}» будет удалена. Фильмы и отметки о просмотре сохранятся.` : action === 'share' ? 'Любой, у кого есть ссылка, сможет увидеть название и фильмы. Это копия коллекции на момент отправки.' : `Коллекция «${item.name}»`;
    const error = document.createElement('p');error.className = 'personal-library-status';error.setAttribute('role', 'alert');
    const form = document.createElement('form');form.className = 'personal-collection-form';
    const cancel = document.createElement('button');cancel.type = 'button';cancel.textContent = action === 'share' ? 'Готово' : 'Отмена';cancel.addEventListener('click', () => dialog.close());
    const submit = document.createElement('button');submit.type = 'submit';submit.textContent = { rename: 'Сохранить', share: 'Скопировать ссылку', delete: 'Удалить' }[action];
    let input;
    if (action !== 'delete') {
      const label = document.createElement('label');label.textContent = action === 'share' ? 'Ссылка на коллекцию' : 'Новое название';
      input = document.createElement('input');input.value = action === 'share' ? collectionShareUrl(item) : item.name;input.readOnly = action === 'share';input.required = true;
      if (action === 'rename') limitTextInput(input, 80);
      label.append(input);form.append(label);
    } else submit.className = 'collection-settings-delete';
    form.append(cancel, submit);dialog.append(title, description, error, form);page.append(dialog);
    let busy = false;
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => {
      dialog.remove();
      const target = [...page.querySelectorAll('[data-collection-settings]')].find(button => button.dataset.collectionSettings === item.id);
      (target || page.querySelector('.personal-collection-management input'))?.focus({ preventScroll: true });
    }, { once: true });
    dialog.addEventListener('click', event => { if (event.target === dialog && !busy) { const rect = dialog.getBoundingClientRect();if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    form.addEventListener('submit', async event => {
      event.preventDefault();if (busy) return;error.textContent = '';
      if (action === 'share') {
        try { await navigator.clipboard.writeText(input.value);error.textContent = 'Ссылка скопирована'; }
        catch { input.focus();input.select();error.textContent = 'Скопируйте выделенную ссылку вручную.'; }
        return;
      }
      busy = true;form.querySelectorAll('button,input').forEach(control => { control.disabled = true; });
      try {
        if (action === 'rename') await renamePersonalCollection(item.id, input.value);else await deletePersonalCollection(item.id);
        if (page.isConnected) { onChange();dialog.close(); }
      } catch (failure) { error.textContent = failure.message || 'Не удалось сохранить изменения.'; }
      finally { busy = false;form.querySelectorAll('button,input').forEach(control => { control.disabled = false; }); }
    });
    dialog.showModal();if (action === 'delete') cancel.focus();else { input.focus();if (action === 'rename') input.select(); }
  };
  for (const [action, label] of [['rename', 'Поменять название'], ['share', 'Поделиться'], ['delete', 'Удалить']]) {
    if (gear && action === 'rename') continue;
    const button = document.createElement('button');button.type = 'button';button.setAttribute('role', 'menuitem');button.textContent = label;
    if (action === 'delete') button.className = 'collection-settings-delete';
    button.addEventListener('click', () => openDialog(action));menu.append(button);
  }
  const showMenu = last => {
    const rect = trigger.getBoundingClientRect();menu.style.left = `${Math.max(8, Math.min(innerWidth - 228, gear ? rect.left : rect.right - 220))}px`;
    menu.style.top = `${Math.max(8, Math.min(innerHeight - 154, rect.bottom + 6))}px`;
    menu.showPopover();(last ? menu.lastElementChild : menu.firstElementChild).focus();
  };
  trigger.addEventListener('click', () => { if (menu.matches(':popover-open')) menu.hidePopover();else showMenu(false); });
  trigger.addEventListener('keydown', event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault();showMenu(event.key === 'ArrowUp'); } });
  menu.addEventListener('toggle', () => { trigger.setAttribute('aria-expanded', String(menu.matches(':popover-open'))); });
  menu.addEventListener('keydown', event => {
    const buttons = [...menu.children], index = buttons.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault();buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus(); }
    if (event.key === 'Escape') { event.preventDefault();menu.hidePopover();trigger.focus(); }
    if (event.key === 'Tab') menu.hidePopover();
  });
  return [trigger, menu];
};
