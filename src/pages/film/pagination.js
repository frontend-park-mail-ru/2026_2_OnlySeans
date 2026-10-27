import { element } from './film-ui.js';
import { paginationItems } from '../../components/ui/pagination/pagination.js';
export const pageFromURL = () => { const url = new URL(location.href);if (url.searchParams.has('season')) { url.searchParams.delete('season');history.replaceState(history.state, '', url.pathname + url.search + url.hash); } const value = Number(new URLSearchParams(location.search).get('page'));return Number.isSafeInteger(value) && value > 0 ? value : 1; };
export const setPageURL = (page, navigate, { replace = false, hash = '' } = {}) => { const url = new URL(location.href);url.searchParams.delete('page');if (page > 1) url.searchParams.set('page', page);navigate(`${url.pathname}${url.search}${hash}`, { render: false, replace }); };
export const scrollToList = node => node.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
export const createPagination = ({ onChange, label = 'Темы' }) => {
  const host = element('div', 'discussion-pagination'), nav = element('nav', 'discussion-pagination__nav');nav.setAttribute('aria-label', `Страницы: ${label.toLowerCase()}`);host.append(nav);
  return { element: host, update(current, total, busy = false) {
    const pages = Math.max(1, Math.ceil(total / 20));nav.replaceChildren();nav.hidden = pages < 2;host.hidden = pages < 2;nav.setAttribute('aria-busy', String(busy));
    const add = (text, number, disabled = false) => { const button = element('button', '', text);button.type = 'button';button.disabled = disabled || busy;if (number === current && text === String(current)) { button.setAttribute('aria-current', 'page');button.setAttribute('aria-label', `Страница ${number}, текущая`); }else if (text === String(number)) button.setAttribute('aria-label', `Страница ${number}`);button.addEventListener('click', () => { if (number !== current) onChange(number); });nav.append(button); };
    add('← Назад', current - 1, current === 1);
    for (const item of paginationItems(current, pages)) { if (item === 'gap') { const gap = element('span', 'pagination-gap', '…');gap.setAttribute('aria-hidden', 'true');nav.append(gap); } else add(String(item), item); }
    add('Вперёд →', current + 1, current === pages);
  } };
};
