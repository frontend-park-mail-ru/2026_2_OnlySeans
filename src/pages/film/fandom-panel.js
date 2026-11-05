import { createPagination, pageFromURL, scrollToList } from './pagination.js';
import { createSpoilerNotice } from './spoiler-notice.js';
import { getFandom, getFandomThreads, fandomErrorMessage } from '../../api/fandom.js';
import { store } from '../../modules/store.js';

import { handleDiscussionAccess } from './discussion-access.js';
import { skeletons, showRetry, createThreadCard, countLabel } from './film-ui.js';
import { element } from '../../utils/dom.js';
import { createThreadComposer } from './thread-composer.js';

const types = [
  ['', 'Все'],
  ['theory', 'Теории'],
  ['discussion', 'Обсуждения'],
  ['question', 'Вопросы'],
];
const sorts = [
  ['new', 'Новые'],
  ['active', 'Активные'],
  ['popular', 'Популярные'],
];
export const createFandomPanel = ({ filmId, page, navigate, refreshSummary, spoilers = null }) => {
  const panel = element('section', 'film-fandom');
  panel.setAttribute('aria-label', 'Обсуждение фильма');
  const metadata = element('div', 'discussion-metadata');
  const counts = element('span', 'discussion-counts', 'Загружаем обсуждение…');
  metadata.append(counts);
  if (store.get('user')) {
    const mine = element('a', 'film-text-link', 'Все мои обсуждения →');
    mine.href = '/me/discussions';
    mine.dataset.link = '';
    metadata.append(mine);
  }
  const controls = element('div', 'fandom-controls');
  const filters = element('div', 'fandom-filters');
  const sort = element('div', 'fandom-sort');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Тип темы');
  sort.setAttribute('role', 'group');
  sort.setAttribute('aria-label', 'Сортировка тем');
  const tools = element('div', 'discussion-tools');
  tools.append(sort);
  controls.append(filters, tools);
  const status = element('div', 'fandom-status');
  const list = element('div', 'fandom-threads');
  status.setAttribute('role', 'status');
  let pageNumber = pageFromURL();
  const paging = createPagination({
    onChange: (number) => {
      pageNumber = number;
      updateURL();
      void loadThreads(true).then(() => scrollToList(controls));
    },
  });
  const params = new URLSearchParams(location.search);
  let type = types.some(([value]) => value === params.get('type')) ? params.get('type') : '';
  let order = sorts.some(([value]) => value === params.get('sort')) ? params.get('sort') : 'new';
  let items = [];
  let total = 0;
  let busy = false;
  let version = 0;
  let disposed = false;
  let controller;
  const valid = () => !disposed && page.isConnected;
  const onAccessError = (error) => handleDiscussionAccess(page, error);
  const updateURL = (replace = false) => {
    const url = new URL(location.href);
    url.searchParams.delete('page');
    if (pageNumber > 1) url.searchParams.set('page', pageNumber);
    url.searchParams.delete('type');
    url.searchParams.delete('sort');
    url.searchParams.delete('season');
    if (type) url.searchParams.set('type', type);
    if (order !== 'new') url.searchParams.set('sort', order);
    navigate(`${url.pathname}${url.search}${url.hash}`, { render: false, replace });
  };
  const setControls = () => {
    filters
      .querySelectorAll('button')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.type === type)),
      );
    sort
      .querySelectorAll('button')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.sort === order)),
      );
  };
  const reloadSummary = async () => {
    try {
      const summary = await getFandom(filmId);
      if (!valid()) return;
      counts.textContent = `${countLabel(summary.threads_count, ['тема', 'темы', 'тем'])} · ${countLabel(summary.participants_count, ['участник', 'участника', 'участников'])}`;
      refreshSummary?.(summary);
    } catch (error) {
      if (valid()) showRetry(counts, fandomErrorMessage(error), reloadSummary);
    }
  };
  const composer = createThreadComposer({
    filmId,
    onAccessError,
    onCreated: (created) => {
      if (!valid()) return;
      if (type && type !== created.type) type = created.type;
      pageNumber = 1;
      order = 'new';
      setControls();
      updateURL(true);
      void loadThreads(true);
      void reloadSummary();
    },
  });
  const fab = element('button', 'topic-fab', '+');
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Новая тема');
  fab.addEventListener('click', () => composer.open({ scroll: true }));
  panel.append(
    createSpoilerNotice(),
    composer.element,
    metadata,
    controls,
    status,
    list,
    paging.element,
    fab,
  );
  const render = () => {
    list.replaceChildren(...items.map((item) => createThreadCard(item, filmId, { spoilers })));
    list.removeAttribute('aria-busy');
    list.removeAttribute('aria-label');
    if (!items.length) {
      const empty = element('div', 'fandom-empty');
      empty.append(
        element('h3', '', type ? 'Тем этого типа пока нет' : 'Пока тихо. Начните первую тему'),
        element('p', 'film-muted', 'У каждой истории есть продолжение — ваше обсуждение.'),
      );
      list.append(empty);
      if (!type && store.get('user')) composer.open({ focus: false });
    }
    paging.update(pageNumber, total, busy);
  };
  const loadThreads = async (reset = false) => {
    controller?.abort();
    controller = new AbortController();
    const current = ++version;
    busy = true;
    status.replaceChildren();
    paging.update(pageNumber, total, true);
    if (reset) {
      items = [];
      skeletons(list);
    }
    try {
      const data = await getFandomThreads(
        filmId,
        { type, sort: order, limit: 20, offset: (pageNumber - 1) * 20 },
        { signal: controller.signal },
      );
      if (!valid() || current !== version) return;
      items = data.threads;
      total = data.total;
      if (pageNumber > Math.max(1, Math.ceil(total / 20))) {
        pageNumber = Math.max(1, Math.ceil(total / 20));
        updateURL(true);
        void loadThreads(true);
        return;
      }
      render();
    } catch (error) {
      if (valid() && current === version && error.name !== 'AbortError') {
        list.removeAttribute('aria-busy');
        if (!items.length) list.replaceChildren();
        onAccessError(error);
        showRetry(status, fandomErrorMessage(error), () => {
          void loadThreads(reset);
        });
      }
    } finally {
      if (current === version) {
        busy = false;
        if (valid()) paging.update(pageNumber, total);
      }
    }
  };
  for (const [value, label] of types) {
    const button = element('button', 'fandom-filter', label);
    button.type = 'button';
    button.dataset.type = value;
    button.addEventListener('click', () => {
      if (type === value) return;
      type = value;
      pageNumber = 1;
      setControls();
      updateURL();
      void loadThreads(true);
    });
    filters.append(button);
  }
  for (const [value, label] of sorts) {
    const button = element('button', '', label);
    button.type = 'button';
    button.dataset.sort = value;
    button.addEventListener('click', () => {
      if (order === value) return;
      order = value;
      pageNumber = 1;
      setControls();
      updateURL();
      void loadThreads(true);
    });
    sort.append(button);
  }
  setControls();
  void loadThreads(true);
  void reloadSummary();
  if (params.get('compose') === '1' && store.get('user')) {
    composer.open();
    const url = new URL(location.href);
    url.searchParams.delete('compose');
    navigate(`${url.pathname}${url.search}${url.hash}`, { render: false, replace: true });
  }
  const observer = new MutationObserver(() => {
    if (page.isConnected) return;
    disposed = true;
    version++;
    controller?.abort();
    composer.persist();
    observer.disconnect();
  });
  observer.observe(page.parentElement, { childList: true });
  return panel;
};
