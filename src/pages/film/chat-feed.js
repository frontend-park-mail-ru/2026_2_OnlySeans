import { getThreadMessages, updatePost, deletePost, fandomErrorMessage } from '../../api/fandom.js';
import { store } from '../../modules/store.js';
import { showFandomError } from '../../services/fandom-notice.js';
import { fandomDraftKey, readFandomDraft } from '../../services/fandom-draft.js';
import { createContentEditor, confirmContentDelete } from './content-editor.js';
import { createChatComposer } from './chat-composer.js';
import { createActionMenu } from './action-menu.js';
import { createReactions } from './reactions.js';
import { showRetry } from './film-ui.js';
import {
  createMessageRow,
  createReplyButton,
  createTopicOpening,
  dayLabel,
  firstLine,
  isGrouped,
} from './chat-message.js';
import { element } from '../../utils/dom.js';

const chronological = (a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id;

export const createChat = ({
  page,
  topic: initialTopic,
  getTopic = () => initialTopic,
  spoilers,
  onChanged,
  onAccessError,
}) => {
  const topic = initialTopic;
  const host = element('section', 'thread-chat');
  const scroller = element('div', 'chat-scroll');
  const start = element('div', 'chat-history-start', 'Загружаем сообщения…');
  const list = element('div', 'chat-messages');
  const failure = element('div', 'chat-load-status');
  const composer = element('div', 'chat-composer');
  const newButton = element('button', 'chat-new', '↓ Новые сообщения');
  const startButton = element('button', 'chat-go-start', '↑ К началу обсуждения');
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'log');
  scroller.setAttribute('aria-label', 'Сообщения темы');
  scroller.setAttribute('aria-live', 'off');
  start.setAttribute('role', 'status');
  newButton.type = 'button';
  newButton.hidden = true;
  scroller.append(start, failure, list);
  startButton.type = 'button';
  startButton.disabled = true;
  startButton.setAttribute('aria-controls', `chat-history-${topic.id}`);
  scroller.id = `chat-history-${topic.id}`;
  host.append(startButton, scroller, newButton, composer);
  const records = new Map();
  const controls = new Map();
  const edits = new Map();
  const controller = new AbortController();
  let jumpingToStart = false;
  let disposed = false;
  let hasMore = false;
  let olderPromise;
  let polling = false;
  let timer;
  let initial = true;
  let newCount = 0;
  let highlightTimer;
  const valid = () => !disposed && page.isConnected;
  const ordered = () => [...records.values()].sort(chronological);
  const atBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 90;
  const basePath = `/film/${topic.film_id}/thread/${topic.id}`;
  const draftKey = () =>
    fandomDraftKey(topic.film_id, store.get('user'), `thread:${topic.id}:root`);
  const access = (error) => {
    onAccessError(error);
    if (error.status === 401) {
      messageComposer.resetEditor();
      messageComposer.render();
      render();
    }
  };
  const bottom = (smooth = false) => {
    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior:
        smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
    });
    newCount = 0;
    newButton.hidden = true;
  };
  // пока читают старые сообщения, новые не дёргают ленту, а копятся на кнопке
  const announceNewMessages = (added) => {
    newCount += added;
    if (!newCount) return;
    newButton.textContent = `↓ Новые сообщения (${newCount})`;
    newButton.hidden = false;
  };
  const preserve = () => {
    const node = [...list.children].find(
      (node) =>
        node.id && node.getBoundingClientRect().bottom >= scroller.getBoundingClientRect().top,
    );
    return node ? { id: node.id, top: node.getBoundingClientRect().top } : null;
  };
  const restore = (anchor) => {
    const node = anchor && document.getElementById(anchor.id);
    if (node) scroller.scrollTop += node.getBoundingClientRect().top - anchor.top;
  };
  const merge = (messages) => {
    let changed = false;
    let added = 0;
    for (const value of messages) {
      const old = records.get(value.id);
      if (!old) added++;
      if (JSON.stringify(old) !== JSON.stringify(value)) {
        records.set(value.id, value);
        changed = true;
      }
    }
    return { changed, added };
  };
  const applyRecord = (updated) => {
    const old = records.get(updated.id);
    records.set(updated.id, {
      ...old,
      ...updated,
      parent_id: old?.parent_id ?? updated.parent_id,
      reply_to: old?.reply_to || null,
    });
    for (const value of records.values())
      if (value.reply_to?.id === updated.id)
        value.reply_to = {
          id: updated.id,
          author: updated.deleted ? null : updated.author,
          text_preview: updated.deleted || updated.spoiler ? '' : firstLine(updated.text),
          spoiler: Boolean(updated.spoiler),
          deleted: Boolean(updated.deleted),
        };
    const anchor = preserve();
    render();
    restore(anchor);
  };
  const seek = async (id, updateHash = true) => {
    while (valid() && !records.has(id) && hasMore) if (!(await loadOlder())) break;
    if (!valid()) return;
    const node = list.querySelector(`#post-${id}`);
    if (!node) {
      showFandomError({ status: 404 });
      return;
    }
    if (updateHash) history.pushState(history.state, '', `${basePath}#post-${id}`);
    node.scrollIntoView({
      block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    node.focus({ preventScroll: true });
    clearTimeout(highlightTimer);
    list
      .querySelectorAll('.post-highlight')
      .forEach((item) => item.classList.remove('post-highlight'));
    node.classList.add('post-highlight');
    highlightTimer = setTimeout(() => node.classList.remove('post-highlight'), 2400);
  };
  const messageComposer = createChatComposer({
    container: composer,
    topic,
    basePath,
    draftKey,
    findRecord: (id) => records.get(id),
    onAccessError: access,
    onSent: async (created, source) => {
      merge([{ ...created, parent_id: source?.id || null, reply_to: source || null }]);
      render();
      bottom(true);
      await refresh(true);
      void onChanged();
    },
  });
  const startEditing = (record) => {
    const edit = createContentEditor({
      draftKey: fandomDraftKey(
        topic.film_id,
        store.get('user'),
        `thread:${topic.id}:edit-post:${record.id}`,
      ),
      initial: record,
      label: 'Редактирование сообщения',
      submitLabel: 'Сохранить',
      onSubmit: (values) => updatePost(record.id, values),
      onAccessError: access,
      onCancel: () => {
        edits.delete(record.id);
        render();
      },
      onDone: (updated) => {
        edits.delete(record.id);
        applyRecord(updated);
        void refresh();
      },
    });
    edits.set(record.id, edit);
    const anchor = preserve();
    render();
    restore(anchor);
    edit.focus();
  };
  const confirmDelete = (record) =>
    confirmContentDelete({
      page,
      title: 'Удалить сообщение?',
      onAccessError: access,
      onDelete: async () => {
        await deletePost(record.id);
        applyRecord({
          ...record,
          deleted: true,
          author: null,
          text: '',
          spoiler: false,
          can_edit: false,
          can_delete: false,
        });
        await refresh();
        void onChanged();
      },
    });
  const messageMenuItems = (record) => {
    const items = [];
    if (record.can_edit) items.push({ label: 'Изменить', onSelect: () => startEditing(record) });
    if (record.can_delete) items.push({ label: 'Удалить', onSelect: () => confirmDelete(record) });
    return items;
  };
  // реакции и кнопки сообщения живут дольше одной перерисовки, поэтому хранятся в controls
  const appendMessageControls = (record, body) => {
    let reaction = controls.get(record.id);
    if (!reaction) {
      reaction = createReactions({
        record,
        kind: 'post',
        page,
        onAccessError: access,
        returnTo: basePath + `#post-${record.id}`,
      });
      controls.set(record.id, reaction);
    } else reaction.update(record);
    const actions = element('div', 'chat-message-actions');
    if (store.get('user')) actions.append(createReplyButton(record, messageComposer.beginReply));
    const items = messageMenuItems(record);
    if (items.length)
      actions.append(createActionMenu({ label: `Действия с сообщением ${record.id}`, items }));
    body.append(reaction.element);
    if (actions.childElementCount) body.append(actions);
  };
  const render = () => {
    list.replaceChildren();
    let previous;
    let day = '';
    const current = getTopic();
    if (!hasMore && current?.created_at) {
      const created = new Date(current.created_at);
      list.append(element('div', 'chat-day', dayLabel(created)));
      day = created.toLocaleDateString('ru');
      list.append(createTopicOpening(current, created));
    }
    for (const record of ordered()) {
      const date = new Date(record.created_at);
      const key = date.toLocaleDateString('ru');
      if (key !== day) {
        list.append(element('div', 'chat-day', dayLabel(date)));
        day = key;
        previous = null;
      }
      const { row, body } = createMessageRow({
        record,
        date,
        own: Boolean(record.author && record.author.id === store.get('user')?.id),
        grouped: isGrouped(record, previous, date),
        editor: edits.get(record.id)?.element,
        spoilers,
        onQuote: (id) => void seek(id),
      });
      if (!record.deleted) appendMessageControls(record, body);
      list.append(row);
      previous = record;
    }
    start.textContent = hasMore ? 'Загрузка ранних сообщений…' : '';
    start.hidden = !hasMore;
  };
  const request = (params) => getThreadMessages(topic.id, params, { signal: controller.signal });
  const loadOlder = () => {
    if (olderPromise) return olderPromise;
    if (!hasMore || !valid()) return Promise.resolve(false);
    olderPromise = (async () => {
      const anchor = preserve();
      try {
        const data = await request({ before: ordered()[0].id, limit: 50 });
        if (!valid()) return false;
        hasMore = data.has_more_before;
        merge(data.messages);
        render();
        restore(anchor);
        return true;
      } catch (error) {
        if (valid() && error.name !== 'AbortError') {
          access(error);
          showRetry(failure, fandomErrorMessage(error), () => {
            void loadOlder();
          });
        }
        return false;
      } finally {
        olderPromise = null;
      }
    })();
    return olderPromise;
  };
  const refresh = async (forceBottom = false) => {
    if (polling || jumpingToStart || !valid()) return;
    polling = true;
    const wasBottom = atBottom();
    const anchor = preserve();
    let changed = false;
    let added = 0;
    try {
      let tail = ordered().at(-1)?.id;
      let more = Boolean(tail);
      while (more && valid()) {
        const data = await request({ after: tail, limit: 100 });
        const merged = merge(data.messages);
        changed ||= merged.changed;
        added += merged.added;
        tail = data.messages.at(-1)?.id || tail;
        more = data.has_more_after && data.messages.length > 0;
      }
      // в последних сообщениях тоже сверяем правки, удаления и реакции
      const latest = await request({ limit: Math.min(100, Math.max(50, records.size)) });
      if (!valid()) return;
      const merged = merge(latest.messages);
      changed ||= merged.changed;
      added += merged.added;
      if (changed) {
        render();
        if (forceBottom || wasBottom) bottom(forceBottom);
        else {
          restore(anchor);
          announceNewMessages(added);
        }
      }
      failure.replaceChildren();
    } catch (error) {
      if (valid() && error.name !== 'AbortError') {
        access(error);
        showFandomError(error, {
          message: fandomErrorMessage(error),
          retry: () => {
            void refresh();
          },
        });
      }
    } finally {
      polling = false;
    }
  };
  const poll = () => {
    clearTimeout(timer);
    if (!valid() || document.hidden) return;
    timer = setTimeout(async () => {
      await refresh();
      poll();
    }, 10000);
  };
  const visibility = () => {
    if (document.hidden) clearTimeout(timer);
    else {
      void refresh();
      poll();
    }
  };
  const hashChanged = () => {
    const match = location.hash.match(/^#post-([1-9]\d*)$/);
    if (match) void seek(Number(match[1]), false);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      if (!initial && !jumpingToStart && entries.some((entry) => entry.isIntersecting) && hasMore)
        void loadOlder();
    },
    { root: scroller, rootMargin: '180px 0px 0px' },
  );
  startButton.addEventListener('click', async () => {
    if (initial || jumpingToStart || !valid()) return;
    jumpingToStart = true;
    startButton.disabled = true;
    startButton.textContent = 'Загружаем начало…';
    let reached = true;
    try {
      while (hasMore && valid()) {
        const first = ordered()[0]?.id;
        if (!(await loadOlder()) || (hasMore && ordered()[0]?.id === first)) {
          reached = false;
          break;
        }
      }
      if (valid() && reached) {
        scroller.scrollTo({
          top: 0,
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
        scroller.focus({ preventScroll: true });
        newCount = 0;
        newButton.hidden = true;
      }
    } finally {
      jumpingToStart = false;
      startButton.disabled = false;
      startButton.textContent = '↑ К началу обсуждения';
    }
  });
  newButton.addEventListener('click', () => bottom(true));
  scroller.addEventListener('scroll', () => {
    if (atBottom()) {
      newCount = 0;
      newButton.hidden = true;
    }
  });
  const startChat = async () => {
    scroller.setAttribute('aria-busy', 'true');
    try {
      const data = await request({ limit: 50 });
      if (!valid()) return;
      records.clear();
      merge(data.messages);
      hasMore = data.has_more_before;
      failure.replaceChildren();
      render();
      const saved = readFandomDraft(draftKey());
      while (saved.parent_id && !records.has(saved.parent_id) && hasMore)
        if (!(await loadOlder())) break;
      messageComposer.render();
      const match = location.hash.match(/^#post-([1-9]\d*)$/);
      if (match) await seek(Number(match[1]), false);
      else bottom();
      initial = false;
      observer.observe(start);
      poll();
    } catch (error) {
      if (valid() && error.name !== 'AbortError') {
        access(error);
        showRetry(failure, fandomErrorMessage(error), () => {
          void startChat();
        });
        start.textContent = '';
      }
    } finally {
      scroller.removeAttribute('aria-busy');
      startButton.disabled = initial;
    }
  };
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('hashchange', hashChanged);
  const dispose = () => {
    disposed = true;
    controller.abort();
    clearTimeout(timer);
    clearTimeout(highlightTimer);
    observer.disconnect();
    messageComposer.persist();
    for (const value of edits.values()) value.persist();
    for (const value of controls.values()) value.dispose();
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('hashchange', hashChanged);
  };
  return { element: host, start: startChat, refresh, rerender: render, dispose };
};
