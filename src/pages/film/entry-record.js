import { element } from '../../utils/dom.js';
import { authorMeta, recordText } from './film-ui.js';
import { createReviewScore } from './rating-picker.js';

export const recordNoun = (review, kind) => {
  if (review) return { name: 'Отзыв', deleteTitle: 'Удалить отзыв?' };
  if (kind === 'comment') return { name: 'Ответ', deleteTitle: 'Удалить ответ?' };
  return { name: 'Сообщение', deleteTitle: 'Удалить сообщение?' };
};

const createPermalink = (record, kind) => {
  const permalink = element('a', 'post-permalink', `№ ${record.id}`);
  permalink.href = `#${kind}-${record.id}`;
  permalink.setAttribute('aria-label', `Ссылка на сообщение ${record.id}`);
  return permalink;
};

const createRecordBody = ({ record, kind, review, editor, spoilers }) => {
  if (editor) return editor;
  // отзыв может состоять только из оценки
  if (review && !String(record.text || '').trim())
    return element('p', 'review-no-text', 'Оценка без текста');
  return recordText(record, spoilers, { key: `${kind}-${record.id}` });
};

// карточка записи без реакций и кнопок: их добавляет лента
export const createRecordCard = ({ record, kind, review, editor, spoilers }) => {
  const classes = [
    'thread-post',
    record.parent_id && 'thread-post--reply',
    review && 'thread-post--review',
  ];
  const card = element('article', classes.filter(Boolean).join(' '));
  card.id = `${kind}-${record.id}`;
  card.tabIndex = -1;
  const author = record.author?.username || 'пользователя';
  const label = record.deleted ? 'Сообщение удалено' : `${recordNoun(review, kind).name} ${author}`;
  card.setAttribute('aria-label', label);

  if (record.deleted) {
    card.append(element('p', 'thread-deleted', 'Сообщение удалено'));
    return card;
  }
  card.append(authorMeta(record));
  if (kind !== 'comment') card.append(createPermalink(record, kind));
  const body = createRecordBody({ record, kind, review, editor, spoilers });
  const score = review && !editor ? createReviewScore(record.ratings) : null;
  if (score) {
    const layout = element('div', 'review-layout');
    const main = element('div', 'review-layout__text');
    main.append(body);
    layout.append(main, score);
    card.append(layout);
  } else card.append(body);
  return card;
};

// у отзывов кнопки стоят под карточкой, у сообщений темы — внутри неё
export const assembleRecord = ({ kind, card, actions, interactive }) => {
  if (kind === 'comment') {
    const entry = element('div', 'entry-record');
    entry.append(card);
    if (interactive && actions.childElementCount) entry.append(actions);
    return entry;
  }
  card.append(actions);
  return card;
};
