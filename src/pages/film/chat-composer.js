import { createPost } from '../../api/fandom.js';
import { store } from '../../modules/store.js';
import { authPath } from '../../services/auth-return.js';
import { readFandomDraft, saveFandomDraft } from '../../services/fandom-draft.js';
import { element } from '../../utils/dom.js';
import { createContentEditor } from './content-editor.js';
import { firstLine, quoteLabel } from './chat-message.js';

const replySource = (record) => ({
  ...record,
  text_preview: record.spoiler ? '' : firstLine(record.text),
});

// поле ввода чата: черновик, ответ на сообщение и приглашение войти для гостей
export const createChatComposer = ({
  container,
  topic,
  basePath,
  draftKey,
  findRecord,
  onAccessError,
  onSent,
}) => {
  const replyBar = element('div', 'chat-reply-bar');
  let editor;
  let reply;

  const renderReply = () => {
    replyBar.replaceChildren();
    replyBar.hidden = !reply;
    if (!reply) {
      editor?.persist();
      return;
    }
    const copy = element('span');
    copy.append(
      element('strong', '', `Ответ для ${reply.author?.username || 'удалённого сообщения'}: `),
      element('span', '', quoteLabel(reply)),
    );
    const close = element('button', '', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Отменить ответ');
    close.addEventListener('click', () => {
      reply = null;
      renderReply();
    });
    replyBar.append(copy, close);
    if (editor) {
      editor.persist();
      const saved = readFandomDraft(draftKey());
      saveFandomDraft(draftKey(), { ...saved, parent_id: reply?.id || null });
    }
  };

  const renderGuest = () => {
    const invitation = element('div', 'chat-guest');
    const login = element('a', 'film-button', 'Войти');
    login.href = authPath('login', basePath + location.hash);
    login.dataset.link = '';
    invitation.append(element('span', '', 'Войдите, чтобы написать'), login);
    container.replaceChildren(invitation);
  };

  const createEditor = () => {
    const saved = readFandomDraft(draftKey());
    const draftParent = saved.parent_id && findRecord(saved.parent_id);
    if (draftParent) reply = replySource(draftParent);
    editor = createContentEditor({
      draftKey: draftKey(),
      label: 'Сообщение в теме',
      chat: true,
      placeholder: 'Напишите сообщение…',
      replyTo: () => reply?.id || null,
      onSubmit: (values) =>
        createPost(topic.id, { ...values, ...(reply ? { parent_id: reply.id } : {}) }),
      onAccessError,
      onDone: async (created) => {
        const source = reply;
        reply = null;
        renderReply();
        await onSent(created, source);
      },
    });
  };

  const render = () => {
    if (!store.get('user')) {
      renderGuest();
      return;
    }
    if (!editor) createEditor();
    container.replaceChildren(replyBar, editor.element);
    renderReply();
  };

  const beginReply = (record) => {
    if (!store.get('user')) {
      container.querySelector('a')?.focus();
      return;
    }
    reply = {
      id: record.id,
      author: record.author,
      text_preview: record.spoiler ? '' : firstLine(record.text),
      spoiler: record.spoiler,
      deleted: record.deleted,
    };
    renderReply();
    editor?.focus();
  };

  // после выхода из аккаунта редактор пересоздаётся, черновик при этом сохраняется
  const resetEditor = () => {
    editor?.persist();
    editor = null;
  };

  return { render, beginReply, resetEditor, persist: () => editor?.persist() };
};
