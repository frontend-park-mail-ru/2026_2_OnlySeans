import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./pagination.css', import.meta.url));
const template = await loadTemplate(new URL('./Pagination.hbs', import.meta.url));

function paginationItems(current, total) {
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
}

export function currentPageNumber(query) {
  const value = Number(query.get('page'));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function pageHref(number, anchor) {
  const url = new URL(location.href);
  url.searchParams.delete('page');
  if (number > 1) url.searchParams.set('page', String(number));
  return `${url.pathname}${url.search}${anchor ? `#${anchor}` : ''}`;
}

export class Pagination extends Component {
  static template = template;

  context() {
    const { current, total, label = 'Страницы', anchor } = this.props;
    const href = (number) => pageHref(number, anchor);
    return {
      label,
      previous: current > 1 ? href(current - 1) : null,
      next: current < total ? href(current + 1) : null,
      items: paginationItems(current, total).map((item) =>
        item === 'gap'
          ? { gap: true }
          : { number: item, href: href(item), current: item === current },
      ),
    };
  }
}
