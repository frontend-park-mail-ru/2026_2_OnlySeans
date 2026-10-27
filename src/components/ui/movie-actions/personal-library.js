import { mountLibraryPopover } from './library-popover.js';
import { store } from '../../../modules/store.js';
import { readPersonalLibrary, loadPersonalLibrary, createPersonalCollection, setCollectionMovie, setMovieWatched } from '../../../services/personal-library.js';
import { syncMovieListButtons } from './movie-actions.js';
import { showNotice } from '../../../services/notice.js';

export const notifyPersonalLibrary = page => {
  const state = readPersonalLibrary();
  page.querySelectorAll('[data-library-movie-id]').forEach(button => {
    const watched = state.watched.includes(Number(button.dataset.libraryMovieId));
    button.classList.toggle('is-watched', watched);button.title = watched ? 'Просмотрено · коллекции' : 'Просмотрено и коллекции';
  });
  syncMovieListButtons(page);
  page.dispatchEvent(new CustomEvent('movielistchange', { detail: { list: 'watchlater', undo: true } }));
  page.dispatchEvent(new CustomEvent('personallibrarychange'));
};

const needLogin = () => showNotice('Войдите, чтобы отмечать просмотренное и создавать свои коллекции.', {type: 'error', duration: 4000});

export const openPersonalLibrary = async (movie, page, origin) => {
  if (!store.get('user')) { needLogin(page);return; }
  const existing = page.querySelector('.personal-library-popover');
  if (existing) { const same = existing.dataset.movieId === String(movie.id);existing.dismiss();if (same) return; }
  origin ||= page.querySelector(`[data-library-movie-id="${movie.id}"]`);
  const dialog = document.createElement('div');dialog.className = 'personal-library-dialog personal-library-popover';dialog.dataset.movieId = movie.id;dialog.id = 'personal-library-popover';dialog.setAttribute('popover', 'auto');dialog.setAttribute('role', 'dialog');dialog.setAttribute('aria-labelledby', 'personal-library-title');
  dialog.innerHTML = `<header class="personal-library-dialog__header"><div><p class="personal-library-eyebrow">Моё кино</p><h2 id="personal-library-title"></h2></div><button type="button" class="personal-library-close" aria-label="Закрыть окно">×</button></header><p class="personal-library-status" role="status">Загружаем коллекции…</p><div class="personal-library-dialog__body" hidden><label class="personal-library-watched" title="Фильм уйдёт из «Смотреть позже», а в коллекциях останется."><input type="checkbox" name="watched"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span><strong>Просмотрено</strong></span></label><h3>В коллекциях</h3><div class="personal-library-options"></div><details class="personal-library-new"><summary>Новая коллекция</summary><form class="personal-library-create"><label>Название коллекции<input name="collection-name" maxlength="80" placeholder="Например, на вечер" required autocomplete="off"></label><button type="submit">Создать и добавить</button></form></details><a class="personal-library-collections-link" href="/my-collections" data-link>Мои коллекции <span aria-hidden="true">→</span></a></div>`;
  dialog.querySelector('h2').textContent = movie.title;
  const close = mountLibraryPopover(dialog, origin, page, movie.id);
  dialog.querySelector('.personal-library-close').addEventListener('click', () => close());
  const status = dialog.querySelector('.personal-library-status');const body = dialog.querySelector('.personal-library-dialog__body');const watched = dialog.querySelector('[name=watched]');const options = dialog.querySelector('.personal-library-options');const form = dialog.querySelector('form');
  let busy = false;
  const showState = () => {
    const data = readPersonalLibrary();watched.checked = data.watched.includes(movie.id);
    options.replaceChildren();
    if (!data.collections.length) { const empty = document.createElement('p');empty.className = 'personal-library-hint';empty.textContent = 'Пока нет коллекций. Создайте первую ниже.';options.append(empty); }
    for (const item of data.collections) {
      const label = document.createElement('label');label.className = 'personal-library-option';const checkbox = document.createElement('input');checkbox.type = 'checkbox';checkbox.checked = item.filmIds.includes(movie.id);checkbox.setAttribute('aria-label', item.name);
      const name = document.createElement('span');name.textContent = item.name;const count = document.createElement('small');count.textContent = String(item.filmIds.length);label.append(checkbox, name, count);
      checkbox.addEventListener('change', async () => { const focused = item.id;await run(() => setCollectionMovie(item.id, movie.id, checkbox.checked));options.querySelector(`[data-collection-id="${focused}"]`)?.focus(); });
      checkbox.dataset.collectionId = item.id;options.append(label);
    }
  };
  const run = async task => {
    if (busy) return false;busy = true;status.textContent = '';
    body.querySelectorAll('input,button').forEach(input => { input.disabled = true; });
    try {
      await task();if (page.isConnected) notifyPersonalLibrary(page);
      if (dialog.isConnected) showState();return true;
    } catch (error) {
      if (dialog.isConnected) {
        if (error.authRequired) { close();needLogin(page); }
        else { status.textContent = error.message || 'Не удалось сохранить изменения.';showState(); }
      }
      return false;
    } finally { busy = false;body.querySelectorAll('input,button').forEach(input => { input.disabled = false; }); }
  };
  watched.addEventListener('change', async () => {
    const next = watched.checked;
    await run(() => setMovieWatched(movie.id, next));
    if (dialog.isConnected) watched.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();const input = form.querySelector('input');const name = input.value;
    if (await run(() => createPersonalCollection(name, movie.id))) { input.value = '';input.focus(); }
  });
  try {
    await loadPersonalLibrary();if (!dialog.isConnected) return;
    status.textContent = '';body.hidden = false;showState();
  } catch (error) {
    if (!dialog.isConnected) return;
    if (error.authRequired) { close();needLogin(page);return; }
    status.textContent = error.message || 'Не удалось загрузить коллекции.';
    const retry = document.createElement('button');retry.type = 'button';retry.className = 'catalog-retry';retry.textContent = 'Попробовать ещё раз';retry.addEventListener('click', () => { close();void openPersonalLibrary(movie, page, origin); });status.append(' ', retry);
  }
};

export const createPersonalLibraryButton = (movie, page) => {
  if (!store.get('user')) return null;
  const button = document.createElement('button');button.type = 'button';button.className = 'movie-list-button movie-library-button';button.dataset.libraryMovieId = movie.id;button.setAttribute('aria-label', `Моё кино: ${movie.title}`);button.title = 'Просмотрено и коллекции';
  button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5h6l2 2h10v13H3V7Z"/><path d="M12 10v7m-3.5-3.5h7"/></svg>';
  button.classList.toggle('is-watched', readPersonalLibrary().watched.includes(movie.id));
  button.setAttribute('aria-haspopup', 'dialog');button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => { void openPersonalLibrary(movie, page, button); });return button;
};
