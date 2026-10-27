import { element } from './film-ui.js';

// Горизонтальная лента с прокруткой: свайп/колесо/клавиатура + кнопки «назад/вперёд».
// Кнопки появляются, только когда содержимое не помещается.

const ARROW = {
  prev: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
};
const icon = path => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', path);svg.append(line);return svg;
};

/** Оборачивает track (ul/div с карточками) в ленту. label — для подписей кнопок («актёров», «фильмов»). */
export const createScrollRow = (track, { label = 'элементы' } = {}) => {
  const root = element('div', 'scroll-row');
  track.classList.add('scroll-row__track');
  const prev = element('button', 'scroll-row__button scroll-row__button--prev');prev.type = 'button';prev.setAttribute('aria-label', `Предыдущие ${label}`);prev.append(icon(ARROW.prev));
  const next = element('button', 'scroll-row__button scroll-row__button--next');next.type = 'button';next.setAttribute('aria-label', `Следующие ${label}`);next.append(icon(ARROW.next));
  root.append(track, prev, next);

  const behavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const page = direction => track.scrollBy({ left: direction * Math.max(track.clientWidth * .85, 160), behavior: behavior() });
  prev.addEventListener('click', () => page(-1));
  next.addEventListener('click', () => page(1));

  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    const overflow = max > 2;
    root.classList.toggle('is-scrollable', overflow);
    root.classList.toggle('at-start', !overflow || track.scrollLeft <= 2);
    root.classList.toggle('at-end', !overflow || track.scrollLeft >= max - 2);
    prev.disabled = !overflow || track.scrollLeft <= 2;
    next.disabled = !overflow || track.scrollLeft >= max - 2;
    prev.hidden = next.hidden = !overflow;
  };
  track.addEventListener('scroll', sync, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(sync).observe(track);
  else window.addEventListener('resize', sync);
  track.addEventListener('load', sync, true);
  requestAnimationFrame(sync);
  return root;
};
