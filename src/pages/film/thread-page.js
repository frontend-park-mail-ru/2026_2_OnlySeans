import { createSpoilerContext } from '../../services/spoiler-context.js';
import { createActionMenu } from './action-menu.js';
import { createReactions } from './reactions.js';
import { createSpoilerNotice } from './spoiler-notice.js';
import { createChat } from './chat-feed.js';
import { showFandomError } from '../../services/fandom-notice.js';
import { handleDiscussionAccess } from './discussion-access.js';
import { getThread, updateThread, deleteThread, fandomErrorMessage } from '../../api/fandom.js';
import { getMovie } from '../../api/movies.js';
import { store } from '../../modules/store.js';
import { fandomDraftKey } from '../../services/fandom-draft.js';
import { createCatalogPage } from '../discover/catalog-ui.js';
import { NotFoundPage } from '../not-found/not-found.js';
import { createContentEditor, confirmContentDelete } from './content-editor.js';
import { element, skeletons, showRetry, threadTypes, recordText, authorMeta, filmIcon } from './film-ui.js';

const fandomReturn = filmId => {
  const fallback = `/film/${filmId}/discussion`;
  try { const path = sessionStorage.getItem(`frame:fandom-return:${filmId}`), url = new URL(path, location.origin);if (url.origin === location.origin && (url.pathname === fallback || url.pathname === `/film/${filmId}/fandom`)) return `${fallback}${url.search}`; }catch { /* Optional navigation context. */ }
  return fallback;
};
export class ThreadPage {
  constructor({ params, navigate }) { this.params = params;this.navigate = navigate; }
  render() {
    const { page, main } = createCatalogPage(this.navigate);main.className = 'film-page thread-page';page.classList.add('catalog-page--chat');document.title = 'Тема — Frame';
    const back = element('a', 'thread-back film-text-link', '← К обсуждению');back.dataset.link = '';back.href = fandomReturn(this.params.id);
    const header = element('section', 'film-panel thread-detail'), status = element('div', 'fandom-status'), feedHost = element('div','chat-feed-host');status.setAttribute('role', 'status');main.append(header, createSpoilerNotice(), status, feedHost);
    const controller = new AbortController();let spoilers, topic, editTopic, reaction, feed, disposed = false;
    const valid = () => page.isConnected && !disposed;
    const returnTo = (kind, id) => `/film/${topic.film_id}/thread/${topic.id}${kind === 'post' ? `#post-${id}` : ''}`;
    const accessError = error => { handleDiscussionAccess(page, error);if (error.status === 401 && topic) { topic.can_edit = false;topic.can_delete = false;renderHeader(); } };
    const refresh = async () => { try { const fresh = await getThread(topic.id, { signal: controller.signal });if (valid()) { topic = fresh;renderHeader();feed?.rerender(); } }catch (error) { if (valid() && error.name !== 'AbortError') showRetry(status, fandomErrorMessage(error), refresh); } };
    const renderHeader = () => {
      if (!topic) return;header.replaceChildren();header.removeAttribute('aria-busy');header.removeAttribute('aria-label');if (editTopic) { header.append(back,editTopic.element);return; }
      const badges = element('div', 'fandom-thread__badges'), type = element('span', 'fandom-type', threadTypes[topic.type] || 'Тема');type.dataset.type = topic.type;badges.append(type);if (topic.spoiler) badges.append(element('span', 'fandom-thread__spoiler', 'Спойлер'));
      const title = element('h1', 'thread-detail__heading', topic.title);title.tabIndex = -1;const actions = element('div', 'thread-actions entry-actions'), items = [];
      if (topic.can_edit) items.push({ label: 'Изменить тему', onSelect: () => { editTopic = createContentEditor({ draftKey: fandomDraftKey(topic.film_id, store.get('user'), `thread:${topic.id}:edit-topic`), topic: true, initial: topic, label: 'Редактирование темы', submitLabel: 'Сохранить', onSubmit: values => updateThread(topic.id, values), onAccessError: accessError, onCancel: () => { editTopic = null;renderHeader(); }, onDone: updated => { topic = updated;editTopic = null;renderHeader();feed?.rerender();void feed?.refresh();document.title = `${topic.title} — Frame`; } });renderHeader();editTopic.focus(); } });
      if (topic.can_delete) items.push({ label: 'Удалить тему', onSelect: () => confirmContentDelete({ page, title: 'Удалить тему?', onAccessError: accessError, onDelete: async () => { await deleteThread(topic.id);if (valid()) this.navigate(fandomReturn(topic.film_id), { replace: true }); } }) });
      if (!reaction) reaction = createReactions({ record: topic, kind: 'thread', page, navigate: this.navigate, onAccessError: accessError, returnTo: returnTo('thread', topic.id) });else reaction.update(topic);actions.append(reaction.element);if (items.length) actions.append(createActionMenu({ label: 'Действия с темой', items }));
      
      const original=element('div','chat-topic-original'), fold=element('button','chat-topic-fold');fold.type='button';original.id=`topic-description-${topic.id}`;fold.setAttribute('aria-controls',original.id);const storageKey=`frame:topic-fold-compact:${topic.id}`;let collapsed=true;try{collapsed=sessionStorage.getItem(storageKey)!=='0';}catch{/* Optional preference. */}
      original.append(recordText(topic,spoilers,{key:`thread-${topic.id}`}));original.hidden=collapsed;fold.replaceChildren(element('span','',collapsed?'О теме':'Скрыть описание'),filmIcon(collapsed?'chevrondown':'chevronup'));fold.setAttribute('aria-expanded',String(!collapsed));fold.addEventListener('click',()=>{collapsed=!collapsed;original.hidden=collapsed;fold.setAttribute('aria-expanded',String(!collapsed));fold.replaceChildren(element('span','',collapsed?'О теме':'Скрыть описание'),filmIcon(collapsed?'chevrondown':'chevronup'));try{sessionStorage.setItem(storageKey,collapsed?'1':'0');}catch{/* Optional preference. */}});
      const summary=element('div','chat-topic-summary'), details=element('div','chat-topic-meta');summary.append(title);details.append(badges,authorMeta(topic),fold);header.append(back,summary,actions,details,original);
    };
    const load = async () => {
      skeletons(header, 1);status.replaceChildren();
      try {
        const data = await getThread(this.params.threadId, { signal: controller.signal });if (!valid()) return;if (data.deleted) { page.replaceWith(new NotFoundPage({ navigate: this.navigate }).render());return; }
        if (String(data.film_id) !== this.params.id) { this.navigate(`/film/${data.film_id}/thread/${data.id}${location.hash}`, { replace: true });return; }
        topic = data;const movie = await getMovie(topic.film_id, { signal: controller.signal });if (!valid()) return;back.textContent = `← Обсуждение · ${movie.title}`;back.href = fandomReturn(topic.film_id);spoilers=createSpoilerContext();document.title = `${topic.title} — Frame`;renderHeader();
        feed?.dispose();feed = createChat({ page, topic, getTopic: () => topic, spoilers, onChanged: refresh, onAccessError: accessError });feedHost.replaceChildren(feed.element);await feed.start();
      }catch (error) { if (!valid() || error.name === 'AbortError') return;if (error.status === 404) { showFandomError(error);page.replaceWith(new NotFoundPage({ navigate: this.navigate }).render());return; }showRetry(status, fandomErrorMessage(error), load); }
    };
    requestAnimationFrame(() => { if (!valid()) return;const observer = new MutationObserver(() => { if (page.isConnected) return;disposed = true;reaction?.dispose();feed?.dispose();editTopic?.persist();controller.abort();observer.disconnect(); });observer.observe(page.parentElement, { childList: true }); });void load();return page;
  }
}
