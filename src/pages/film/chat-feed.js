import { getThreadMessages, createPost, updatePost, deletePost, fandomErrorMessage } from '../../api/fandom.js';
import { store } from '../../modules/store.js';
import { authPath } from '../../services/auth-return.js';
import { showFandomError } from '../../services/fandom-notice.js';
import { fandomDraftKey, readFandomDraft, saveFandomDraft } from '../../services/fandom-draft.js';
import { createContentEditor, confirmContentDelete } from './content-editor.js';
import { createActionMenu } from './action-menu.js';
import { createReactions } from './reactions.js';
import { element, authorAvatar, recordText, showRetry } from './film-ui.js';

const chronological = (a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id;
const firstLine = text => (text || '').split('\n')[0].slice(0, 120);
export const createChat = ({ page, topic: initialTopic, getTopic = () => initialTopic, spoilers, onChanged, onAccessError }) => {
  const topic = initialTopic;
  const host = element('section', 'thread-chat'), scroller = element('div', 'chat-scroll'), start = element('div', 'chat-history-start', 'Загружаем сообщения…'), list = element('div', 'chat-messages'), failure = element('div', 'chat-load-status'), composer = element('div', 'chat-composer'), newButton = element('button', 'chat-new', '↓ Новые сообщения'), startButton = element('button', 'chat-go-start', '↑ К началу обсуждения');
  scroller.tabIndex = 0;scroller.setAttribute('role', 'log');scroller.setAttribute('aria-label', 'Сообщения темы');scroller.setAttribute('aria-live', 'off');start.setAttribute('role', 'status');newButton.type = 'button';newButton.hidden = true;scroller.append(start, failure, list);startButton.type = 'button';startButton.disabled = true;startButton.setAttribute('aria-controls', `chat-history-${topic.id}`);scroller.id = `chat-history-${topic.id}`;host.append(startButton, scroller, newButton, composer);
  const records = new Map(), controls = new Map(), edits = new Map(), controller = new AbortController();let jumpingToStart = false;let editor, reply, disposed = false, hasMore = false, olderPromise, polling = false, timer, initial = true, newCount = 0, highlightTimer;
  const valid = () => !disposed && page.isConnected;
  const ordered = () => [...records.values()].sort(chronological);
  const atBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 90;
  const basePath = `/film/${topic.film_id}/thread/${topic.id}`;
  const draftKey = () => fandomDraftKey(topic.film_id, store.get('user'), `thread:${topic.id}:root`);
  const access = error => { onAccessError(error);if (error.status === 401) { editor?.persist();editor = null;renderComposer();render(); } };
  const bottom = (smooth = false) => { scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });newCount = 0;newButton.hidden = true; };
  const quoteLabel = source => source.deleted ? 'Сообщение удалено' : source.spoiler ? 'Спойлер' : firstLine(source.text_preview ?? source.text);
  const preserve = () => { const node = [...list.children].find(node => node.id && node.getBoundingClientRect().bottom >= scroller.getBoundingClientRect().top);return node ? { id: node.id, top: node.getBoundingClientRect().top } : null; };
  const restore = anchor => { const node = anchor && document.getElementById(anchor.id);if (node) scroller.scrollTop += node.getBoundingClientRect().top - anchor.top; };
  const merge = messages => { let changed = false, added = 0;for (const value of messages) { const old = records.get(value.id);if (!old) added++;if (JSON.stringify(old) !== JSON.stringify(value)) { records.set(value.id, value);changed = true; } }return { changed, added }; };
  const applyRecord = updated => {
    const old = records.get(updated.id);records.set(updated.id, { ...old, ...updated, parent_id: old?.parent_id ?? updated.parent_id, reply_to: old?.reply_to || null });
    for (const value of records.values()) if (value.reply_to?.id === updated.id) value.reply_to = { id: updated.id, author: updated.deleted ? null : updated.author, text_preview: updated.deleted || updated.spoiler ? '' : firstLine(updated.text), spoiler: Boolean(updated.spoiler), deleted: Boolean(updated.deleted) };
    const anchor = preserve();render();restore(anchor);
  };
  const seek = async (id, updateHash = true) => {
    while (valid() && !records.has(id) && hasMore) if (!await loadOlder()) break;
    if (!valid()) return;const node = list.querySelector(`#post-${id}`);
    if (!node) { showFandomError({ status: 404 });return; }
    if (updateHash) history.pushState(history.state, '', `${basePath}#post-${id}`);
    node.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });node.focus({ preventScroll: true });clearTimeout(highlightTimer);list.querySelectorAll('.post-highlight').forEach(item => item.classList.remove('post-highlight'));node.classList.add('post-highlight');highlightTimer = setTimeout(() => node.classList.remove('post-highlight'), 2400);
  };
  const beginReply = record => { if (!store.get('user')) { composer.querySelector('a')?.focus();return; }reply = { id: record.id, author: record.author, text_preview: record.spoiler ? '' : firstLine(record.text), spoiler: record.spoiler, deleted: record.deleted };renderReply();editor?.focus(); };
  const replyBar = element('div', 'chat-reply-bar');
  const renderReply = () => {
    replyBar.replaceChildren();replyBar.hidden = !reply;if (!reply) { if(editor){editor.persist();}return; }
    const copy = element('span');copy.append(element('strong', '', `Ответ для ${reply.author?.username || 'удалённого сообщения'}: `), element('span', '', quoteLabel(reply)));const close = element('button', '', '×');close.type = 'button';close.setAttribute('aria-label', 'Отменить ответ');close.addEventListener('click', () => { reply = null;renderReply(); });replyBar.append(copy, close);
    if (editor) { editor.persist();const saved = readFandomDraft(draftKey());saveFandomDraft(draftKey(), { ...saved, parent_id: reply?.id || null }); }
  };
  const renderComposer = () => {
    if (!store.get('user')) { const invitation = element('div', 'chat-guest');const login = element('a', 'film-button', 'Войти');login.href = authPath('login', basePath + location.hash);login.dataset.link = '';invitation.append(element('span', '', 'Войдите, чтобы написать'), login);composer.replaceChildren(invitation);return; }
    if (!editor) {
      const saved = readFandomDraft(draftKey());if (saved.parent_id && records.has(saved.parent_id)) { const source = records.get(saved.parent_id);reply = { ...source, text_preview: source.spoiler ? '' : firstLine(source.text) }; }
      editor = createContentEditor({ draftKey: draftKey(), label: 'Сообщение в теме', chat: true, placeholder: 'Напишите сообщение…', replyTo: () => reply?.id || null, onSubmit: values => createPost(topic.id, { ...values, ...(reply ? { parent_id: reply.id } : {}) }), onAccessError: access,
        onDone: async created => { const source = reply;merge([{ ...created, parent_id: source?.id || null, reply_to: source || null }]);reply = null;renderReply();render();bottom(true);await refresh(true);void onChanged(); } });
    }
    composer.replaceChildren(replyBar, editor.element);renderReply();
  };
  const render = () => {
    list.replaceChildren();const values = ordered();let previous, day = '';
    const dayLabel = date => { const key = date.toLocaleDateString('ru'), now = new Date(), yesterday = new Date();yesterday.setDate(now.getDate() - 1);return key === now.toLocaleDateString('ru') ? 'Сегодня' : key === yesterday.toLocaleDateString('ru') ? 'Вчера' : date.toLocaleDateString('ru', { day: 'numeric', month: 'long', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) }); };
    // Первое сообщение ленты — служебное: кто и когда создал тему и как она называется.
    const current = getTopic();
    if (!hasMore && current?.created_at) {
      const created = new Date(current.created_at);
      list.append(element('div', 'chat-day', dayLabel(created)));day = created.toLocaleDateString('ru');
      const opening = element('div', 'chat-topic-start');opening.id = `topic-start-${current.id}`;
      const line = element('p', 'chat-topic-start__line');
      const author = current.author?.username || 'Удалённый пользователь';
      line.append(element('strong', '', author), document.createTextNode(' создал(а) тему'));
      const name = element('p', 'chat-topic-start__title', current.title);
      const time = element('time', 'chat-topic-start__time', created.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }));time.dateTime = current.created_at;time.title = created.toLocaleString('ru');
      opening.append(line, name, time);list.append(opening);
    }
    for (const record of values) {
      const date = new Date(record.created_at), key = date.toLocaleDateString('ru');
      if (key !== day) { list.append(element('div', 'chat-day', dayLabel(date)));day = key;previous = null; }
      const own = Boolean(record.author && record.author.id === store.get('user')?.id), grouped = !record.deleted && previous?.author && previous.author.id === record.author?.id && !previous.deleted && date - new Date(previous.created_at) < 300000;
      const row = element('article', `chat-message${own ? ' chat-message--own' : ''}${grouped ? ' chat-message--grouped' : ''}${record.deleted ? ' chat-message--deleted' : ''}`);row.id = `post-${record.id}`;row.tabIndex = -1;row.dataset.messageId = record.id;
      if (!own && !grouped && record.author) row.append(authorAvatar(record.author));
      const body = element('div', 'chat-message__body'), bubble = element('div', 'chat-bubble');
      if (!own && !grouped && record.author) body.append(element('div', 'chat-author', record.author.username));
      if (record.deleted) bubble.append(element('p', 'thread-deleted', 'Сообщение удалено'));
      else {
        if (record.reply_to) { const quote = element('button', 'chat-quote');quote.type = 'button';quote.append(element('strong', '', record.reply_to.author?.username || 'Удалённое сообщение'), element('span', '', quoteLabel(record.reply_to)));quote.setAttribute('aria-label', `Перейти к сообщению ${record.reply_to.id}`);quote.addEventListener('click', () => { void seek(record.reply_to.id); });bubble.append(quote); }
        
        bubble.append(edits.get(record.id)?.element || recordText(record, spoilers, { key: `post-${record.id}` }));
      }
      const time = element('time', 'chat-time', date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }));time.dateTime = record.created_at;time.title = date.toLocaleString('ru');if (new Date(record.updated_at) > date && !record.deleted) time.prepend(document.createTextNode('изменено · '));bubble.append(time);body.append(bubble);
      if (!record.deleted) {
        let reaction = controls.get(record.id);if (!reaction) { reaction = createReactions({ record, kind: 'post', page, onAccessError: access, returnTo: basePath + `#post-${record.id}` });controls.set(record.id, reaction); }else reaction.update(record);
        const actions = element('div', 'chat-message-actions');
        if (store.get('user')) { const answer = element('button', 'chat-action chat-reply-action');answer.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5-6 6 6 6M3 11h10a8 8 0 0 1 8 8"/></svg>';answer.append(element('span', '', 'Ответить'));answer.type = 'button';answer.setAttribute('aria-label', `Ответить на сообщение ${record.author?.username || 'пользователя'}`);answer.addEventListener('click', () => beginReply(record));actions.append(answer); }
        const items = [];
        if (record.can_edit) items.push({ label: 'Изменить', onSelect: () => { const edit = createContentEditor({ draftKey: fandomDraftKey(topic.film_id, store.get('user'), `thread:${topic.id}:edit-post:${record.id}`), initial: record, label: 'Редактирование сообщения', submitLabel: 'Сохранить', onSubmit: values => updatePost(record.id, values), onAccessError: access, onCancel: () => { edits.delete(record.id);render(); }, onDone: updated => { edits.delete(record.id);applyRecord(updated);void refresh(); } });edits.set(record.id, edit);const anchor = preserve();render();restore(anchor);edit.focus(); } });
        if (record.can_delete) items.push({ label: 'Удалить', onSelect: () => confirmContentDelete({ page, title: 'Удалить сообщение?', onAccessError: access, onDelete: async () => { await deletePost(record.id);applyRecord({ ...record, deleted: true, author: null, text: '', spoiler: false, can_edit: false, can_delete: false });await refresh();void onChanged(); } }) });
        if (items.length) actions.append(createActionMenu({ label: `Действия с сообщением ${record.id}`, items }));body.append(reaction.element);if(actions.childElementCount)body.append(actions);
      }
      row.append(body);list.append(row);previous = record;
    }
    start.textContent = hasMore ? 'Загрузка ранних сообщений…' : '';start.hidden = !hasMore;
  };
  const request = params => getThreadMessages(topic.id, params, { signal: controller.signal });
  const loadOlder = () => {
    if (olderPromise) return olderPromise;if (!hasMore || !valid()) return Promise.resolve(false);
    olderPromise = (async () => { const anchor = preserve();try { const data = await request({ before: ordered()[0].id, limit: 50 });if (!valid()) return false;hasMore = data.has_more_before;merge(data.messages);render();restore(anchor);return true; }catch (error) { if (valid() && error.name !== 'AbortError') { access(error);showRetry(failure, fandomErrorMessage(error), () => { void loadOlder(); }); }return false; }finally { olderPromise = null; } })();return olderPromise;
  };
  const refresh = async (forceBottom = false) => {
    if (polling || jumpingToStart || !valid()) return;polling = true;const wasBottom = atBottom(), anchor = preserve();let changed = false, added = 0;
    try {
      let tail = ordered().at(-1)?.id, more = Boolean(tail);
      while (more && valid()) { const data = await request({ after: tail, limit: 100 });const merged = merge(data.messages);changed ||= merged.changed;added += merged.added;tail = data.messages.at(-1)?.id || tail;more = data.has_more_after && data.messages.length > 0; }
      // Reconcile edits/deletions and reactions in the latest window too.
      const latest = await request({ limit: Math.min(100, Math.max(50, records.size)) });if (!valid()) return;const merged = merge(latest.messages);changed ||= merged.changed;added += merged.added;
      if (changed) { render();if (forceBottom || wasBottom) bottom(forceBottom);else { restore(anchor);newCount += added;if (newCount) { newButton.textContent = `↓ Новые сообщения (${newCount})`;newButton.hidden = false; } } }
      failure.replaceChildren();
    }catch (error) { if (valid() && error.name !== 'AbortError') { access(error);showFandomError(error, { message: fandomErrorMessage(error), retry: () => { void refresh(); } }); } }
    finally { polling = false; }
  };
  const poll = () => { clearTimeout(timer);if (!valid() || document.hidden) return;timer = setTimeout(async () => { await refresh();poll(); }, 10000); };
  const visibility = () => { if (document.hidden) clearTimeout(timer);else { void refresh();poll(); } };
  const hashChanged = () => { const match = location.hash.match(/^#post-([1-9]\d*)$/);if (match) void seek(Number(match[1]), false); };
  const observer = new IntersectionObserver(entries => { if (!initial && !jumpingToStart && entries.some(entry => entry.isIntersecting) && hasMore) void loadOlder(); }, { root: scroller, rootMargin: '180px 0px 0px' });
  startButton.addEventListener('click', async () => {
    if (initial || jumpingToStart || !valid()) return;
    jumpingToStart = true;startButton.disabled = true;startButton.textContent = 'Загружаем начало…';
    let reached = true;
    try {
      while (hasMore && valid()) { const first = ordered()[0]?.id;if (!await loadOlder() || (hasMore && ordered()[0]?.id === first)) { reached = false;break; } }
      if (valid() && reached) {
        scroller.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
        scroller.focus({preventScroll: true});newCount = 0;newButton.hidden = true;
      }
    } finally { jumpingToStart = false;startButton.disabled = false;startButton.textContent = '↑ К началу обсуждения'; }
  });
  newButton.addEventListener('click', () => bottom(true));scroller.addEventListener('scroll', () => { if (atBottom()) { newCount = 0;newButton.hidden = true; } });
  const startChat = async () => {
    scroller.setAttribute('aria-busy', 'true');try { const data = await request({ limit: 50 });if (!valid()) return;records.clear();merge(data.messages);hasMore = data.has_more_before;failure.replaceChildren();render();const saved = readFandomDraft(draftKey());while(saved.parent_id && !records.has(saved.parent_id) && hasMore) if(!await loadOlder()) break;renderComposer();const match = location.hash.match(/^#post-([1-9]\d*)$/);if (match) await seek(Number(match[1]), false);else bottom();initial = false;observer.observe(start);poll(); }
    catch (error) { if (valid() && error.name !== 'AbortError') { access(error);showRetry(failure, fandomErrorMessage(error), () => { void startChat(); });start.textContent = ''; } }
    finally { scroller.removeAttribute('aria-busy');startButton.disabled = initial; }
  };
  document.addEventListener('visibilitychange', visibility);window.addEventListener('hashchange', hashChanged);
  const dispose = () => { disposed = true;controller.abort();clearTimeout(timer);clearTimeout(highlightTimer);observer.disconnect();editor?.persist();for (const value of edits.values()) value.persist();for (const value of controls.values()) value.dispose();document.removeEventListener('visibilitychange', visibility);window.removeEventListener('hashchange', hashChanged); };
  return { element: host, start: startChat, refresh, rerender: render, dispose };
};
