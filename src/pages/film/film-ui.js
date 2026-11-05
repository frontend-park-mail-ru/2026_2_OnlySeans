import { tablerIconPaths as iconPaths } from '../../components/ui/icons/tabler.js';
import { showNotice } from '../../services/notice.js';
import { pluralize } from '../../utils/plural.js';
import { element } from '../../utils/dom.js';
export const threadTypes = { theory: 'Теория', discussion: 'Обсуждение', question: 'Вопрос' };
export const skeletons = (container, count = 3) => {
  container.replaceChildren();
  container.setAttribute('aria-busy', 'true');
  container.setAttribute('aria-label', 'Загрузка');
  for (let i = 0; i < count; i++) {
    const card = element('div', 'film-skeleton');
    card.setAttribute('aria-hidden', 'true');
    card.append(element('span'), element('span'), element('span'));
    container.append(card);
  }
};
export const showRetry = (container, message, retry) => {
  showNotice(message, { type: 'error', action: { label: 'Повторить', onClick: retry } });
  container.replaceChildren();
  container.classList.add('discussion-load-error');
  container.removeAttribute('aria-busy');
  container.append(element('h3', '', 'Не удалось загрузить'), element('p', '', message));
  const button = element('button', 'film-button film-button--quiet', 'Повторить');
  button.type = 'button';
  button.addEventListener('click', retry);
  container.append(button);
};
export const relativeDate = (value, now = Date.now()) => {
  const date = new Date(value);
  const difference = Math.max(0, now - date.getTime());
  if (!Number.isFinite(date.getTime()) || difference < 60000) return 'Только что';
  const relative = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
  if (difference < 3600000) return relative.format(-Math.floor(difference / 60000), 'minute');
  if (difference < 86400000) return relative.format(-Math.floor(difference / 3600000), 'hour');
  if (difference < 604800000) return relative.format(-Math.floor(difference / 86400000), 'day');
  return date.toLocaleDateString('ru', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}),
  });
};
export const HOT_THREAD_POSTS = 20;
const reactionArtwork = {
  fire: new URL('../../media/emoji/fire.svg', import.meta.url).href,
  heart: new URL('../../media/emoji/heart.svg', import.meta.url).href,
  laugh: new URL('../../media/emoji/laugh.svg', import.meta.url).href,
  wow: new URL('../../media/emoji/wow.svg', import.meta.url).href,
  sad: new URL('../../media/emoji/sad.svg', import.meta.url).href,
};

export const filmIcon = (name) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('data-icon', name);
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (reactionArtwork[name]) {
    svg.classList.add('reaction-emoji');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('stroke', 'none');
    const artwork = document.createElementNS(svg.namespaceURI, 'image');
    artwork.setAttribute('href', reactionArtwork[name]);
    artwork.setAttribute('width', '36');
    artwork.setAttribute('height', '36');
    svg.append(artwork);
    return svg;
  }
  for (const pathData of iconPaths[name] || []) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', pathData);
    svg.append(path);
  }
  return svg;
};
export const authorAvatar = (author) => {
  const avatar = element(
    'span',
    'fandom-avatar',
    Array.from((author?.username || '?').trim())[0]?.toUpperCase() || '?',
  );
  let hash = 0;
  for (const char of String(author?.id || 0)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  avatar.dataset.tone = String(hash % 6);
  avatar.setAttribute('aria-hidden', 'true');
  return avatar;
};
const rememberFandomReturn = (link, filmId) =>
  link.addEventListener('click', () => {
    try {
      sessionStorage.setItem(
        `frame:fandom-return:${filmId}`,
        `${location.pathname}${location.search}`,
      );
    } catch {
      /* без этого просто не будет возврата к ленте */
    }
  });
const createThreadCardBase = (thread, filmId, { spoilers = null } = {}) => {
  const href = `/film/${filmId}/thread/${encodeURIComponent(thread.id)}`;
  const card = element(
    'article',
    `fandom-thread${thread.posts_count >= HOT_THREAD_POSTS ? ' fandom-thread--hot' : ''}`,
  );
  card.dataset.threadId = thread.id;
  const top = element('div', 'fandom-thread__top');
  const badges = element('div', 'fandom-thread__badges');
  const type = element('span', 'fandom-type', threadTypes[thread.type] || 'Тема');
  type.dataset.type = thread.type;
  badges.append(type);
  if (thread.spoiler) badges.append(element('span', 'fandom-thread__spoiler', 'Спойлер'));
  if (thread.posts_count >= HOT_THREAD_POSTS) {
    const hot = element('span', 'fandom-thread__hot');
    hot.append(filmIcon('fire'), document.createTextNode('Горячая'));
    badges.append(hot);
  }
  const time = element('time', '', relativeDate(thread.created_at));
  time.dateTime = thread.created_at;
  time.title = new Date(thread.created_at).toLocaleString('ru');
  top.append(badges, time);
  const heading = element('h3');
  const link = element('a', 'fandom-thread__link', thread.title);
  link.href = href;
  link.dataset.link = '';
  rememberFandomReturn(link, filmId);
  heading.append(link);
  const meta = element('div', 'fandom-thread__meta');
  const author = element('span', 'fandom-thread__identity');
  author.append(
    authorAvatar(thread.author),
    element('span', 'fandom-thread__author', thread.author?.username || 'Пользователь'),
  );
  const posts = element('span', 'fandom-thread__posts');
  const count = thread.posts_count;
  const ending = pluralize(count, ['ответ', 'ответа', 'ответов']);
  posts.append(
    element('strong', '', `${count} ${ending}`),
    element('span', '', `последний ${relativeDate(thread.last_activity_at)}`),
  );
  meta.append(author, reactionSummary(thread.reactions), posts);
  card.append(
    top,
    heading,
    recordText(thread, spoilers, { preview: true, key: `thread-${thread.id}` }),
    meta,
  );
  return card;
};
export const reactionSummary = (values) => {
  const reactions = element('span', 'fandom-thread__reactions');
  for (const [code, name] of [
    ['fire', 'Огонь'],
    ['heart', 'Любовь'],
    ['laugh', 'Смех'],
    ['wow', 'Удивление'],
    ['sad', 'Грусть'],
  ].sort((a, b) => (values?.[b[0]] || 0) - (values?.[a[0]] || 0))) {
    const count = values?.[code] || 0;
    if (!count) continue;
    const reaction = element('span', 'reaction-pill');
    reaction.setAttribute('aria-label', `${name}: ${count}`);
    reaction.dataset.reactionCode = code;
    reaction.append(filmIcon(code), element('span', 'reaction-count', String(count)));
    reactions.append(reaction);
  }
  return reactions;
};

export const textLength = (value) => Array.from(value.trim()).length;
export const checkTextLength = (value, min, max) => {
  const length = textLength(value);
  if (length < min) return `Минимум ${min} символ${min === 1 ? '' : 'а'}`;
  if (length > max) return `Максимум ${max} символов`;
  return '';
};
export const spoilerText = (text, hidden, { preview = false, onReveal } = {}) => {
  const box = element('div', preview ? 'fandom-thread__preview' : 'thread-body');
  if (!hidden) {
    box.textContent = text;
    return box;
  }
  box.classList.add('spoiler-container');
  const shield = element('button', 'spoiler-shield');
  shield.type = 'button';
  const caption = 'Отобразить спойлер';
  shield.setAttribute('aria-label', caption);
  const lines = element('span', 'spoiler-lines');
  lines.setAttribute('aria-hidden', 'true');
  const count = Math.max(1, Math.min(preview ? 2 : 4, Math.ceil(Array.from(text).length / 70)));
  for (let i = 0; i < count; i++) lines.append(element('span'));
  const pill = element('span', 'spoiler-pill');
  pill.append(filmIcon('eye'), element('span', '', caption));
  shield.append(lines, pill);
  box.append(shield);
  shield.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      box.classList.remove('spoiler-container');
      box.classList.add('spoiler-revealed');
      box.textContent = text;
      onReveal?.();
    },
    { once: true },
  );
  return box;
};
export const authorMeta = (record) => {
  const meta = element('div', 'fandom-thread__meta');
  const time = element('time', '', relativeDate(record.created_at));
  time.dateTime = record.created_at;
  time.title = new Date(record.created_at).toLocaleString('ru');
  meta.append(
    authorAvatar(record.author),
    element('span', 'fandom-thread__author', record.author?.username || 'Пользователь'),
    time,
  );
  if (new Date(record.updated_at) > new Date(record.created_at))
    meta.append(element('span', 'thread-edited', 'изменено'));
  return meta;
};

export const countLabel = (count, forms) => `${count} ${pluralize(count, forms)}`;

export const recordText = (record, spoilers, { preview = false, key = '' } = {}) => {
  const hidden = record.spoiler && !spoilers?.revealed.has(key);
  return spoilerText(record.text || '', hidden, {
    preview,
    onReveal: () => spoilers?.revealed.add(key),
  });
};

export const createThreadCard = (thread, filmId, options = {}) =>
  createThreadCardBase(thread, filmId, options);
