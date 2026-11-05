import { element } from '../../../utils/dom.js';

// пагинация «‹ 1 … 4 5 6 … 12 ›»: номера — обычные ссылки ?page=N,
// клик перехватывается и меняет страницу без перезагрузки

// первая, последняя, текущая и её соседи; «…» ставится, только если прячет две страницы и больше
export const paginationItems = (current, total) => {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const items = [];
  for (const page of pages) {
    const previous = items.at(-1);
    if (page - previous === 2) items.push(previous + 1);
    if (page - previous > 2) items.push('gap');
    items.push(page);
  }
  return items;
};

// адрес текущей страницы с другим номером; page=1 из адреса убирается
export const pageHref = (number, base = location.href) => {
  const url = new URL(base);
  url.searchParams.delete('page');
  if (number > 1) url.searchParams.set('page', String(number));
  return `${url.pathname}${url.search}${url.hash}`;
};

// всё, что не целое число ≥ 1, считается первой страницей
export const pageFromLocation = () => {
  const raw = new URLSearchParams(location.search).get('page');
  const value = Number(raw);
  return raw && /^\d+$/.test(raw) && Number.isSafeInteger(value) && value > 0 ? value : 1;
};

const NS = 'http://www.w3.org/2000/svg';
const arrow = (path) => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS(NS, 'path');
  line.setAttribute('d', path);
  svg.append(line);
  return svg;
};

// onSelect вызывается при обычном клике, href нужен для открытия в новой вкладке
export const renderPagination = (nav, { current, total, onSelect, hrefFor = pageHref }) => {
  nav.replaceChildren();
  nav.hidden = total < 2;
  if (total < 2) return;

  const link = (number, className, label) => {
    const node = element('a');
    node.className = `pagination__item ${className}`.trim();
    node.href = hrefFor(number);
    if (label) node.setAttribute('aria-label', label);
    node.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      if (number !== current) onSelect(number, node);
    });
    return node;
  };
  // на первой странице нет «Назад», на последней — «Вперёд»
  const step = (direction) => {
    const previous = direction < 0;
    const node = link(
      current + direction,
      '',
      previous ? 'Предыдущая страница' : 'Следующая страница',
    );
    node.classList.add('pagination__step', `pagination__step--${previous ? 'prev' : 'next'}`);
    const label = element('span', 'pagination__step-text', previous ? 'Назад' : 'Вперёд');
    const icon = arrow(previous ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6');
    if (previous) node.append(icon, label);
    else node.append(label, icon);
    return node;
  };

  const list = element('div', 'pagination__pages');
  for (const item of paginationItems(current, total)) {
    if (item === 'gap') {
      const gap = element('span', 'pagination__gap', '…');
      gap.setAttribute('aria-hidden', 'true');
      list.append(gap);
      continue;
    }
    const node = link(
      item,
      '',
      item === current ? `Страница ${item}, текущая` : `Страница ${item}`,
    );
    node.textContent = String(item);
    if (item === current) node.setAttribute('aria-current', 'page');
    list.append(node);
  }
  if (current > 1) nav.append(step(-1));
  nav.append(list);
  if (current < total) nav.append(step(1));
};
