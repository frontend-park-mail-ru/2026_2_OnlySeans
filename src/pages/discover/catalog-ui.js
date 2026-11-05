import { createSidebar } from '../../components/ui/sidebar/sidebar.js';
import { getMoviePoster } from '../../services/posters.js';
import { pluralize } from '../../utils/plural.js';
import { element } from '../../utils/dom.js';

export const homeAsset = (name) => new URL(`../../media/home/${name}.svg`, import.meta.url).href;
export const filmCount = (count) => `${count} ${pluralize(count, ['фильм', 'фильма', 'фильмов'])}`;

export const createCatalogPage = (navigate) => {
  const page = element('div', 'catalog-page');
  const container = element('div', 'catalog-container');
  const main = element('main');
  container.append(main);
  page.append(...createSidebar(page, container, navigate), container);
  return { page, main };
};

export const sectionHeading = (title, { link, href, count, level = 2 } = {}) => {
  const heading = element('div', 'catalog-heading');
  const h2 = element(`h${level}`);
  const star = element('img');
  star.src = homeAsset('section-star');
  star.width = 22;
  star.height = 22;
  star.alt = '';
  h2.append(star, document.createTextNode(title));
  heading.append(h2);
  if (link) {
    const linkElement = element('a');
    linkElement.href = href;
    linkElement.dataset.link = '';
    linkElement.textContent = link;
    heading.append(linkElement);
  } else if (count !== undefined) {
    const span = element('span', '', count);
    span.className = 'catalog-count';
    heading.append(span);
  }
  return heading;
};

export const createStatus = (text) => {
  const status = element('p', 'catalog-status');
  status.setAttribute('role', 'status');
  status.textContent = text;
  return status;
};
export const showLoadError = (status, retry, message = 'Не удалось загрузить данные.') => {
  status.replaceChildren(document.createTextNode(`${message} `));
  const button = element('button');
  button.type = 'button';
  button.className = 'catalog-retry';
  button.textContent = 'Попробовать ещё раз';
  button.addEventListener('click', retry);
  status.append(button);
};

const posterImage = (movie, className = '') => {
  const img = element('img');
  img.src = getMoviePoster(movie) || '';
  img.alt = '';
  img.className = className;
  img.decoding = 'async';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    img.hidden = true;
    img.parentElement.classList.add('poster-unavailable');
  });
  return img;
};

export const createPosterStack = (films) => {
  const stack = element('div', 'poster-stack');
  stack.setAttribute('aria-hidden', 'true');
  films.slice(0, 3).forEach((movie) => {
    const frame = element('div', 'poster-stack__frame');
    frame.append(posterImage(movie));
    stack.append(frame);
  });
  return stack;
};

export const createCollectionCard = (collection) => {
  const card = element('a', 'collection-card');
  card.href = `/collections?id=${collection.id}`;
  card.dataset.link = '';
  const text = element('div', 'collection-card__text');
  const count = element('span', 'collection-card__count', filmCount(collection.films.length));
  const title = element('h3', '', collection.title);
  const description = element('p', '', collection.description || '');
  text.append(count, title, description);
  card.append(text, createPosterStack(collection.films));
  return card;
};

export const createMovieTile = (movie) => {
  const tile = element('a');
  tile.href = `/film/${movie.id}`;
  tile.dataset.link = '';
  tile.className = 'movie-tile';
  tile.setAttribute('aria-label', `О фильме: ${movie.title}`);
  const cover = element('span', 'movie-tile__cover');
  cover.append(posterImage(movie));
  const rating = element(
    'span',
    'movie-tile__rating',
    `★ ${Number.isFinite(movie.rating) ? movie.rating.toFixed(1) : '—'}`,
  );
  if (!Number.isFinite(movie.rating)) rating.classList.add('movie-tile__rating--unavailable');
  cover.append(rating);
  const title = element('span', 'movie-tile__title', movie.title);
  title.title = movie.title;
  const meta = element(
    'span',
    'movie-tile__meta',
    [movie.year, movie.type === 'series' ? 'Сериал' : 'Фильм'].filter(Boolean).join(' · '),
  );
  const description = element('span', 'movie-tile__description', movie.description);
  tile.append(cover, title, meta, description);
  const shell = element('div', 'movie-tile-shell');
  shell.append(tile);
  return shell;
};
