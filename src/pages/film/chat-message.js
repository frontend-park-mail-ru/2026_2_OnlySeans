import { element } from '../../utils/dom.js';
import { authorAvatar, recordText } from './film-ui.js';

// подряд идущие сообщения одного автора в пределах пяти минут склеиваются
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const REPLY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5-6 6 6 6M3 11h10a8 8 0 0 1 8 8"/></svg>';

const shortTime = (date) => date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

export const firstLine = (text) => (text || '').split('\n')[0].slice(0, 120);

export const quoteLabel = (source) => {
  if (source.deleted) return 'Сообщение удалено';
  if (source.spoiler) return 'Спойлер';
  return firstLine(source.text_preview ?? source.text);
};

export const dayLabel = (date) => {
  const key = date.toLocaleDateString('ru');
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (key === now.toLocaleDateString('ru')) return 'Сегодня';
  if (key === yesterday.toLocaleDateString('ru')) return 'Вчера';
  const options = { day: 'numeric', month: 'long' };
  if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
  return date.toLocaleDateString('ru', options);
};

export const isGrouped = (record, previous, date) =>
  !record.deleted &&
  previous?.author &&
  previous.author.id === record.author?.id &&
  !previous.deleted &&
  date - new Date(previous.created_at) < GROUP_WINDOW_MS;

// служебная первая запись ленты: кто создал тему и как она называется
export const createTopicOpening = (topic, created) => {
  const opening = element('div', 'chat-topic-start');
  opening.id = `topic-start-${topic.id}`;
  const line = element('p', 'chat-topic-start__line');
  const author = topic.author?.username || 'Удалённый пользователь';
  line.append(element('strong', '', author), document.createTextNode(' создал(а) тему'));
  const name = element('p', 'chat-topic-start__title', topic.title);
  const time = element('time', 'chat-topic-start__time', shortTime(created));
  time.dateTime = topic.created_at;
  time.title = created.toLocaleString('ru');
  opening.append(line, name, time);
  return opening;
};

const createQuote = (reply, onQuote) => {
  const quote = element('button', 'chat-quote');
  quote.type = 'button';
  quote.append(
    element('strong', '', reply.author?.username || 'Удалённое сообщение'),
    element('span', '', quoteLabel(reply)),
  );
  quote.setAttribute('aria-label', `Перейти к сообщению ${reply.id}`);
  quote.addEventListener('click', () => onQuote(reply.id));
  return quote;
};

const createMessageTime = (record, date) => {
  const time = element('time', 'chat-time', shortTime(date));
  time.dateTime = record.created_at;
  time.title = date.toLocaleString('ru');
  if (new Date(record.updated_at) > date && !record.deleted)
    time.prepend(document.createTextNode('изменено · '));
  return time;
};

// строка сообщения без реакций и меню; их добавляет чат в body
export const createMessageRow = ({ record, date, own, grouped, editor, spoilers, onQuote }) => {
  const classes = [
    'chat-message',
    own && 'chat-message--own',
    grouped && 'chat-message--grouped',
    record.deleted && 'chat-message--deleted',
  ];
  const row = element('article', classes.filter(Boolean).join(' '));
  row.id = `post-${record.id}`;
  row.tabIndex = -1;
  row.dataset.messageId = record.id;
  const showAuthor = !own && !grouped && record.author;
  if (showAuthor) row.append(authorAvatar(record.author));

  const body = element('div', 'chat-message__body');
  const bubble = element('div', 'chat-bubble');
  if (showAuthor) body.append(element('div', 'chat-author', record.author.username));
  if (record.deleted) {
    bubble.append(element('p', 'thread-deleted', 'Сообщение удалено'));
  } else {
    if (record.reply_to) bubble.append(createQuote(record.reply_to, onQuote));
    bubble.append(editor || recordText(record, spoilers, { key: `post-${record.id}` }));
  }
  bubble.append(createMessageTime(record, date));
  body.append(bubble);
  row.append(body);
  return { row, body };
};

export const createReplyButton = (record, onClick) => {
  const button = element('button', 'chat-action chat-reply-action');
  button.innerHTML = REPLY_ICON;
  button.append(element('span', '', 'Ответить'));
  button.type = 'button';
  button.setAttribute(
    'aria-label',
    `Ответить на сообщение ${record.author?.username || 'пользователя'}`,
  );
  button.addEventListener('click', () => onClick(record));
  return button;
};
