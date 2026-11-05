import { createFandomThread } from '../../api/fandom.js';
import { store } from '../../modules/store.js';
import { fandomDraftKey } from '../../services/fandom-draft.js';
import { showNotice } from '../../services/notice.js';
import { createContentEditor } from './content-editor.js';
import { authorAvatar } from './film-ui.js';
import { element } from '../../utils/dom.js';

export const createThreadComposer = ({ filmId, onCreated, onAccessError }) => {
  const host = element('section', 'inline-topic-composer');
  host.setAttribute('aria-label', 'Новая тема');
  const invitation = element('button', 'topic-invitation');
  invitation.type = 'button';
  invitation.append(authorAvatar(store.get('user')), element('span', '', 'Начните новую тему…'));
  invitation.setAttribute('aria-expanded', 'false');
  host.append(invitation);
  let editor;
  let folding = false;
  const collapse = () => {
    folding = true;
    editor?.persist();
    editor?.element.remove();
    invitation.hidden = false;
    invitation.setAttribute('aria-expanded', 'false');
    invitation.focus({ preventScroll: true });
    queueMicrotask(() => {
      folding = false;
    });
  };
  const open = ({ focus = true, scroll = false } = {}) => {
    if (!store.get('user')) {
      showNotice('Войдите, чтобы создавать темы.', { type: 'error', duration: 4000 });
      return;
    }
    if (!editor)
      editor = createContentEditor({
        draftKey: fandomDraftKey(filmId, store.get('user')),
        topic: true,
        typeButtons: true,
        label: 'Новая тема',
        submitLabel: 'Опубликовать',
        onSubmit: (values) => createFandomThread(filmId, values),
        onAccessError,
        onCancel: collapse,
        onDone: (created) => {
          editor.element.remove();
          editor = null;
          invitation.hidden = false;
          invitation.setAttribute('aria-expanded', 'false');
          onCreated(created);
        },
      });
    invitation.hidden = true;
    invitation.setAttribute('aria-expanded', 'true');
    host.append(editor.element);
    if (scroll)
      host.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    if (focus) editor.element.querySelector('input')?.focus({ preventScroll: true });
  };
  invitation.addEventListener('click', () => open());
  invitation.addEventListener('focus', () => {
    if (!folding && store.get('user') && invitation.matches(':focus-visible')) open();
  });
  return { element: host, open, persist: () => editor?.persist() };
};
