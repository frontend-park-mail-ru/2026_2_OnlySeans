// Пагинация: «‹ 1 … 4 5 6 … 12 ›». Номера — настоящие ссылки (?page=N): их можно открыть в новой вкладке,
// а обычный клик перехватывается и меняет страницу без перезагрузки.

/** Номера страниц и пропуски ('gap'). Всегда 7 позиций или меньше: первая, последняя, текущая и её соседи. */
export const paginationItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'gap', total];
  if (current >= total - 3) return [1, 'gap', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'gap', current - 1, current, current + 1, 'gap', total];
};

/** Адрес текущей страницы с другим номером: page=1 из адреса убирается. */
export const pageHref = (number, base = location.href) => {
  const url = new URL(base);url.searchParams.delete('page');
  if (number > 1) url.searchParams.set('page', String(number));
  return `${url.pathname}${url.search}${url.hash}`;
};

/** Номер страницы из адреса: всё, что не целое число ≥ 1, — первая страница. */
export const pageFromLocation = () => {
  const raw = new URLSearchParams(location.search).get('page');
  const value = Number(raw);
  return raw && /^\d+$/.test(raw) && Number.isSafeInteger(value) && value > 0 ? value : 1;
};

const NS = 'http://www.w3.org/2000/svg';
const arrow = path => {
  const svg = document.createElementNS(NS, 'svg');svg.setAttribute('viewBox', '0 0 24 24');svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS(NS, 'path');line.setAttribute('d', path);svg.append(line);return svg;
};

/**
 * Перерисовывает nav. onSelect(number, link) вызывается при обычном клике; href — для открытия в новой вкладке.
 */
export const renderPagination = (nav, { current, total, onSelect, hrefFor = pageHref }) => {
  nav.replaceChildren();
  nav.hidden = total < 2;
  if (total < 2) return;

  const link = (number, className, label) => {
    const node = document.createElement('a');node.className = `pagination__item ${className}`.trim();node.href = hrefFor(number);
    if (label) node.setAttribute('aria-label', label);
    node.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (number !== current) onSelect(number, node);
    });
    return node;
  };
  const step = (number, direction) => {
    const disabled = number < 1 || number > total;
    const text = direction < 0 ? 'Назад' : 'Вперёд';
    const node = disabled ? document.createElement('span') : link(number, '', `${direction < 0 ? 'Предыдущая' : 'Следующая'} страница`);
    node.className = `pagination__item pagination__step pagination__step--${direction < 0 ? 'prev' : 'next'}`;
    if (disabled) node.setAttribute('aria-disabled', 'true');
    const label = document.createElement('span');label.className = 'pagination__step-text';label.textContent = text;
    const icon = arrow(direction < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6');
    if (direction < 0) node.append(icon, label);else node.append(label, icon);
    return node;
  };

  const list = document.createElement('div');list.className = 'pagination__pages';
  for (const item of paginationItems(current, total)) {
    if (item === 'gap') { const gap = document.createElement('span');gap.className = 'pagination__gap';gap.textContent = '…';gap.setAttribute('aria-hidden', 'true');list.append(gap);continue; }
    const node = link(item, '', item === current ? `Страница ${item}, текущая` : `Страница ${item}`);node.textContent = String(item);
    if (item === current) node.setAttribute('aria-current', 'page');
    list.append(node);
  }
  nav.append(step(current - 1, -1), list, step(current + 1, 1));
};
