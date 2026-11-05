import { createPagination, pageFromURL, setPageURL, scrollToList } from './pagination.js';
import { store } from '../../modules/store.js';
import { showNotice } from '../../services/notice.js';
import { fandomDraftKey } from '../../services/fandom-draft.js';
import { fandomErrorMessage } from '../../api/fandom.js';
import { createButton } from '../../components/ui/button/button.js';
import { createContentEditor, confirmContentDelete } from './content-editor.js';
import { createActionMenu } from './action-menu.js';
import { createReactions } from './reactions.js';
import { authorAvatar, skeletons, showRetry } from './film-ui.js';
import { element } from '../../utils/dom.js';
import { assembleRecord, createRecordCard, recordNoun } from './entry-record.js';

// и сообщения темы, и отзывы о фильме: общая пагинация, ответы в один уровень, правки
export const createEntryFeed = ({
  page,
  kind,
  filmId,
  scope,
  basePath,
  navigate,
  loadPage,
  create,
  update,
  remove,
  onChanged = () => {},
  onCreated = () => false,
  onAccessError = () => {},
  rootAtTop = false,
  replyLimit = Infinity,
  spoilers = null,
  emptyText = null,
  initialReview = () => ({}),
}) => {
  const host = element('section', `entry-feed entry-feed--${kind}`);
  const list = element('div', 'thread-posts');
  const status = element('div', 'fandom-status');
  const write = element('section', 'thread-write');
  status.setAttribute('role', 'status');
  let pageNumber = pageFromURL();
  const paging = createPagination({
    label: kind === 'comment' ? 'Отзывы' : 'Сообщения',
    onChange: (number) => {
      pageNumber = number;
      setPageURL(number, navigate);
      void refresh().then(() => scrollToList(list));
    },
  });
  if (rootAtTop) host.append(write, status, list, paging.element);
  else host.append(status, list, paging.element, write);
  let roots = [];
  let offset = 0;
  let total = 1;
  let busy = false;
  let disposed = false;
  let controller;
  let rootEditor;
  let replyEditor;
  let generation = 0;
  let highlightTimer;
  const edits = new Map();
  const reactions = new Map();
  const expanded = new Set();
  const valid = () => !disposed && page.isConnected;
  const key = (part) => fandomDraftKey(filmId, store.get('user'), `${scope}:${part}`);
  const returnTo = (id) => `${basePath}${location.search}${id ? `#${kind}-${id}` : ''}`;
  const accessError = (error) => {
    onAccessError(error);
    if (error.status === 401) {
      for (const root of roots)
        for (const record of [root, ...(root.replies || [])]) {
          record.can_edit = false;
          record.can_delete = false;
        }
      renderWrite();
      render();
    }
  };
  const button = (text, callback) => {
    const node = createButton({ text, variant: 'secondary' });
    node.addEventListener('click', callback);
    return node;
  };
  const highlight = (id) => {
    if (!valid()) return;
    const root = roots.find(
      (root) => root.id === id || root.replies?.some((reply) => reply.id === id),
    );
    if (!root) return;
    expanded.add(root.id);
    render();
    const node = list.querySelector(`#${kind}-${id}`);
    if (!node) return;
    clearTimeout(highlightTimer);
    list
      .querySelectorAll('.post-highlight')
      .forEach((item) => item.classList.remove('post-highlight'));
    node.classList.add('post-highlight');
    node.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'center',
    });
    node.focus({ preventScroll: true });
    highlightTimer = setTimeout(() => node.classList.remove('post-highlight'), 2600);
  };
  const find = (id) =>
    roots.some((root) => root.id === id || root.replies?.some((reply) => reply.id === id));
  const loadUntil = async (id) => {
    while (valid() && !find(id) && offset < total) {
      pageNumber++;
      if (!(await load())) return false;
    }
    if (find(id)) setPageURL(pageNumber, navigate, { replace: true, hash: `#${kind}-${id}` });
    return find(id);
  };
  const loadHash = async () => {
    const match = location.hash.match(new RegExp(`^#${kind}-([1-9]\\d*)$`));
    if (!match) return;
    const id = Number(match[1]);
    if (await loadUntil(id)) highlight(id);
    else if (valid() && !busy && offset >= total) status.textContent = 'Сообщение не найдено.';
  };
  const afterCreated = async (record) => {
    if (!valid()) return;
    replyEditor = null;
    if (onCreated(record)) return;
    await refresh(record.id);
    if (valid()) {
      history.replaceState(history.state, '', returnTo(record.id));
      highlight(record.id);
      void onChanged();
    }
  };
  const renderWrite = () => {
    if (!store.get('user')) {
      rootEditor?.persist();
      const invitation = button(kind === 'comment' ? 'Напишите отзыв…' : 'Ответить на тему…', () =>
        showNotice(
          kind === 'comment'
            ? 'Войдите, чтобы писать отзывы.'
            : 'Войдите, чтобы отвечать в обсуждении.',
          { type: 'error', duration: 4000 },
        ),
      );
      invitation.classList.add('guest-write');
      write.replaceChildren(invitation);
      return;
    }
    if (!rootEditor)
      rootEditor = createContentEditor({
        draftKey: key('root'),
        label: kind === 'comment' ? 'Ваш отзыв' : 'Ваш ответ',
        compact: rootAtTop,
        ratings: kind === 'comment',
        initial: kind === 'comment' ? initialReview() : {},
        placeholder:
          kind === 'comment' ? 'Напишите отзыв и оцените фильм по осям…' : 'Поделитесь мыслью…',
        textLabel: kind === 'comment' ? 'Отзыв' : 'Текст сообщения',
        onSubmit: create,
        onAccessError: accessError,
        onDone: (record) => {
          void afterCreated(record);
        },
      });
    if (rootAtTop) {
      const wrapper = element('div', 'comment-composer');
      wrapper.append(authorAvatar(store.get('user')), rootEditor.element);
      write.replaceChildren(wrapper);
    } else write.replaceChildren(rootEditor.element);
  };
  const openReply = (record, root) => {
    if (!store.get('user')) {
      showNotice('Войдите, чтобы отвечать на сообщения.', { type: 'error', duration: 4000 });
      return;
    }
    replyEditor?.editor.persist();
    expanded.add(root.id);
    const editor = createContentEditor({
      draftKey: key(`reply:${record.id}`),
      initial: { text: '' },
      label: record.author ? `Ответ для ${record.author.username}` : 'Ответ на удалённое сообщение',
      onSubmit: (values) => create({ ...values, parent_id: record.id }),
      onAccessError: accessError,
      onCancel: () => {
        replyEditor = null;
        render();
      },
      onDone: (created) => {
        void afterCreated(created);
      },
    });
    replyEditor = { rootId: root.id, editor };
    render();
    editor.focus();
  };
  const replace = (record) => {
    for (const [rootIndex, root] of roots.entries()) {
      if (root.id === record.id) {
        roots[rootIndex] = { ...record, replies: root.replies };
        return;
      }
      const index = root.replies?.findIndex((reply) => reply.id === record.id);
      if (index >= 0) {
        root.replies[index] = record;
        return;
      }
    }
  };
  const startEditing = (record, review) => {
    const editor = createContentEditor({
      draftKey: key(`edit-${kind}:${record.id}`),
      initial: record,
      ratings: review,
      label: review ? 'Редактирование отзыва' : 'Редактирование',
      submitLabel: 'Сохранить',
      onSubmit: (values) => update(record.id, values),
      onAccessError: accessError,
      onCancel: () => {
        edits.delete(record.id);
        render();
      },
      onDone: (updated) => {
        edits.delete(record.id);
        replace(updated);
        render();
        highlight(updated.id);
      },
    });
    edits.set(record.id, editor);
    render();
    editor.focus();
  };
  const confirmDelete = (record, review) =>
    confirmContentDelete({
      page,
      title: recordNoun(review, kind).deleteTitle,
      onAccessError: accessError,
      onDelete: async () => {
        await remove(record.id);
        edits.delete(record.id);
        await refresh();
        void onChanged();
      },
    });
  const recordMenuItems = (record, review) => {
    const items = [];
    if (record.can_edit && !record.deleted && !edits.has(record.id))
      items.push({ label: 'Изменить', onSelect: () => startEditing(record, review) });
    if (record.can_delete && !record.deleted)
      items.push({ label: 'Удалить', onSelect: () => confirmDelete(record, review) });
    return items;
  };
  // реакции переживают перерисовку ленты, поэтому хранятся в reactions
  const reactionsFor = (record) => {
    let control = reactions.get(record.id);
    if (!control) {
      control = createReactions({
        record,
        kind,
        page,
        navigate,
        onAccessError: accessError,
        returnTo: returnTo(record.id),
      });
      reactions.set(record.id, control);
    } else control.update(record);
    return control;
  };
  const renderRecord = (record, root) => {
    const review = kind === 'comment' && !record.parent_id;
    // гостю отзывы показываются без реакций и кнопок
    const interactive = kind !== 'comment' || Boolean(store.get('user'));
    if (!interactive) {
      reactions.get(record.id)?.dispose();
      reactions.delete(record.id);
    }
    const editor = edits.get(record.id)?.element;
    const card = createRecordCard({ record, kind, review, editor, spoilers });
    const actions = element('div', 'thread-actions entry-actions');
    if (interactive && !record.deleted) actions.append(reactionsFor(record).element);
    if (interactive) actions.append(button('Ответить', () => openReply(record, root)));
    const items = recordMenuItems(record, review);
    if (interactive && items.length)
      actions.append(createActionMenu({ label: `Действия с сообщением ${record.id}`, items }));
    return assembleRecord({ kind, card, actions, interactive });
  };
  const render = () => {
    list.replaceChildren();
    list.removeAttribute('aria-busy');
    list.removeAttribute('aria-label');
    const live = new Set();
    if (!roots.length)
      list.append(
        element(
          'p',
          'fandom-empty',
          emptyText ||
            (kind === 'comment'
              ? 'Отзывов пока нет. Будьте первым'
              : 'Пока никто не ответил. Будьте первым'),
        ),
      );
    for (const root of roots) {
      live.add(root.id);
      const group = element('section', 'thread-post-group');
      group.append(renderRecord(root, root));
      const replies = element('div', 'thread-replies');
      const all = root.replies || [];
      const visible = expanded.has(root.id) ? all : all.slice(0, replyLimit);
      for (const reply of visible) {
        live.add(reply.id);
        replies.append(renderRecord(reply, root));
      }
      if (visible.length < all.length)
        replies.append(
          button(`Ещё ${all.length - visible.length} ответов`, () => {
            expanded.add(root.id);
            render();
          }),
        );
      group.append(replies);
      if (replyEditor?.rootId === root.id) group.append(replyEditor.editor.element);
      list.append(group);
    }
    for (const [id, control] of reactions)
      if (!live.has(id)) {
        control.dispose();
        reactions.delete(id);
      }
    paging.update(pageNumber, total, busy);
  };
  const load = async () => {
    if (busy || !valid()) return false;
    busy = true;
    paging.update(pageNumber, total, true);
    status.replaceChildren();
    let loaded = false;
    const version = generation;
    try {
      const data = await loadPage(
        { limit: 20, offset: (pageNumber - 1) * 20 },
        { signal: controller.signal },
      );
      if (!valid() || generation !== version) return false;
      total = data.total;
      const last = Math.max(1, Math.ceil(total / 20));
      if (pageNumber > last) {
        pageNumber = last;
        setPageURL(last, navigate, { replace: true });
        const corrected = await loadPage(
          { limit: 20, offset: (pageNumber - 1) * 20 },
          { signal: controller.signal },
        );
        if (!valid() || generation !== version) return false;
        data.items = corrected.items;
      }
      loaded = true;
      paging.element.hidden = false;
      roots = data.items;
      offset = (pageNumber - 1) * 20 + data.items.length;
      if (!data.items.length) offset = total;
      render();
      return true;
    } catch (error) {
      if (valid() && generation === version && error.name !== 'AbortError') {
        list.removeAttribute('aria-busy');
        if (!roots.length) list.replaceChildren();
        accessError(error);
        showRetry(status, fandomErrorMessage(error), () => {
          void load().then((ok) => {
            if (ok) void loadHash();
          });
        });
      }
      return false;
    } finally {
      if (generation === version) {
        busy = false;
        if (valid()) {
          paging.element.hidden = !loaded;
          if (loaded) paging.update(pageNumber, total);
        }
      }
    }
  };
  const refresh = async (target) => {
    if (target) pageNumber = 1;
    generation++;
    controller?.abort();
    controller = new AbortController();
    busy = false;
    roots = [];
    offset = 0;
    total = 1;
    skeletons(list);
    paging.element.hidden = true;
    if (!(await load())) return;
    if (target && !find(target)) await loadUntil(target);
    if (!target) await loadHash();
  };
  const hashListener = () => {
    void loadHash();
  };
  window.addEventListener('hashchange', hashListener);
  renderWrite();
  controller = new AbortController();
  skeletons(list);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    generation++;
    controller.abort();
    clearTimeout(highlightTimer);
    window.removeEventListener('hashchange', hashListener);
    rootEditor?.persist();
    replyEditor?.editor.persist();
    for (const editor of edits.values()) editor.persist();
    for (const control of reactions.values()) control.dispose();
  };
  return {
    element: host,
    start: async () => {
      if (await load()) await loadHash();
    },
    refresh,
    rerender: render,
    dispose,
  };
};
