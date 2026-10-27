import { showFandomError } from '../../services/fandom-notice.js';
import { setThreadReaction, removeThreadReaction, setPostReaction, removePostReaction, setCommentReaction, removeCommentReaction, fandomErrorMessage } from '../../api/fandom.js';
import { store } from '../../modules/store.js';
import { showNotice } from '../../services/notice.js';

import { element, filmIcon } from './film-ui.js';

const choices = [['fire', 'Огонь'], ['heart', 'Нравится'], ['laugh', 'Смешно'], ['wow', 'Удивительно'], ['sad', 'Грустно']];
const requests = { thread: [setThreadReaction, removeThreadReaction], post: [setPostReaction, removePostReaction], comment: [setCommentReaction, removeCommentReaction] };
let closeActiveMenu;
let nextMenu = 0;
export const createReactions = ({ record, kind, page, onAccessError = () => {}, returnTo }) => {
  const host = element('div', 'interactive-reactions');host.dataset.reactionTarget = `${kind}-${record.id}`;
  const row = element('div', 'reaction-row');row.setAttribute('role', 'group');row.setAttribute('aria-label', 'Реакции');
  const plus = element('button', 'reaction-add');plus.type = 'button';plus.title = 'Добавить реакцию';plus.setAttribute('aria-label', plus.title);plus.setAttribute('aria-haspopup', 'menu');plus.setAttribute('aria-expanded', 'false');plus.append(filmIcon('smileplus'));
  const menu = element('div', 'reaction-menu');menu.id = `reaction-menu-${++nextMenu}`;menu.setAttribute('popover', 'auto');menu.setAttribute('role', 'menu');menu.setAttribute('aria-label', 'Выберите реакцию');plus.setAttribute('aria-controls', menu.id);
  let current = record, counts = { ...record.reactions }, mine = new Set(record.my_reactions || []), disposed = false;
  const pending = new Set(), pills = new Map(), options = new Map();
  const alive = () => !disposed && page.isConnected;
  const sync = () => { current.reactions = { ...counts };current.my_reactions = [...mine]; };
  const close = (restore = true) => { if (menu.matches(':popover-open')) menu.hidePopover();if (closeActiveMenu === close) closeActiveMenu = null;if (restore && plus.isConnected) plus.focus({ preventScroll: true }); };
  const position = () => { if (!menu.matches(':popover-open')) return;const rect = plus.getBoundingClientRect();menu.style.left = `${Math.max(8, Math.min(innerWidth - menu.offsetWidth - 8, rect.left))}px`;menu.style.top = `${rect.top > menu.offsetHeight + 12 ? rect.top - menu.offsetHeight - 8 : Math.min(innerHeight - menu.offsetHeight - 8, rect.bottom + 8)}px`; };
  const render = () => {
    plus.disabled = pending.size > 0;
    for (const [code, label] of choices) {
      const button = pills.get(code), option = options.get(code), count = counts[code] || 0;
      button.hidden = !count && !pending.has(code);button.disabled = pending.size > 0;button.setAttribute('aria-pressed', String(mine.has(code)));button.setAttribute('aria-label', `${label}: ${count}`);button.querySelector('.reaction-count').textContent = String(count);
      option.disabled = pending.size > 0;option.setAttribute('aria-checked', String(mine.has(code)));option.setAttribute('aria-pressed', String(mine.has(code)));
    }
    const focused = row.contains(document.activeElement) ? document.activeElement : null;
    const sorted = choices.map(([code], index) => ({code,index})).sort((a,b) => (counts[b.code] || 0) - (counts[a.code] || 0) || a.index - b.index);
    row.append(...sorted.map(({code}) => pills.get(code)), plus);
    if (focused && !focused.hidden && !focused.disabled) focused.focus({preventScroll:true});
  };
  const login = () => { close(false);showNotice('Войдите, чтобы ставить реакции.', {type: 'error', duration: 4000}); };
  const toggle = async code => {
    if (!alive() || pending.size) return;
    if (!store.get('user')) { login();return; }
    
    const previous = { ...counts }, previousMine = new Set(mine), wasMine = mine.has(code);
    for (const old of mine) { pending.add(old);counts[old] = Math.max(0, (counts[old] || 0) - 1); }
    pending.add(code);mine.clear();if (!wasMine) { counts[code] = (counts[code] || 0) + 1;mine.add(code); }sync();render();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pills.get(code).querySelector('svg').animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-3px) scale(1.17)' }, { transform: 'translateY(0) scale(1)' }], { duration: 260, easing: 'ease-out' });
      pills.get(code).querySelector('.reaction-count').animate([{ opacity: .35, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180 });
    }
    try { await requests[kind][wasMine ? 1 : 0](current.id, code); }
    catch (error) {
      counts = previous;mine = previousMine;sync();
      if (alive()) { showFandomError(error, { message: fandomErrorMessage(error), retry: () => { void toggle(code); }, returnTo });onAccessError(error); }
    } finally { pending.clear();if (alive()) render(); }
  };
  for (const [code, label] of choices) {
    const button = element('button', 'reaction-pill');button.type = 'button';button.dataset.reactionCode = code;button.append(filmIcon(code), element('span', 'reaction-count', '0'));button.addEventListener('click', () => { void toggle(code); });pills.set(code, button);row.append(button);
    const option = element('button');option.type = 'button';option.dataset.reactionCode = code;option.setAttribute('role', 'menuitemcheckbox');option.setAttribute('aria-label', label);option.title = label;option.append(filmIcon(code), element('span', 'reaction-tooltip', label));option.addEventListener('click', () => { close();void toggle(code); });options.set(code, option);menu.append(option);
  }
  row.append(plus);host.append(row, menu);
  plus.addEventListener('click', () => { if (!store.get('user')) { login();return; }if (menu.matches(':popover-open')) close();else { closeActiveMenu?.(false);menu.showPopover();closeActiveMenu = close;position();menu.querySelector('button:not(:disabled)')?.focus({ preventScroll: true }); } });
  menu.addEventListener('toggle', event => { plus.setAttribute('aria-expanded', String(event.newState === 'open')); });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault();event.stopPropagation();close();return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();const buttons = [...menu.querySelectorAll('button:not(:disabled)')], index = buttons.indexOf(document.activeElement);const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;buttons[next]?.focus();
  });
  window.addEventListener('resize', position);window.addEventListener('scroll', position, true);render();
  return { element: host, update(next) { if (current === next) return;if (!pending.size) { counts = { ...next.reactions };mine = new Set(next.my_reactions || []); }current = next;sync();render(); }, dispose() { disposed = true;close(false);window.removeEventListener('resize', position);window.removeEventListener('scroll', position, true); } };
};
