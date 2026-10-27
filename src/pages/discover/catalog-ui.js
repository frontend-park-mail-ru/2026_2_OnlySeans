import { createSidebar } from '../../components/ui/sidebar/sidebar.js';
import { getMoviePoster } from '../../services/posters.js';
import { createMovieListButton } from '../../components/ui/movie-actions/movie-actions.js';
import { createPersonalLibraryButton } from '../../components/ui/movie-actions/personal-library.js';

export const homeAsset = name => new URL(`../../media/home/${name}.svg`, import.meta.url).href;
export const filmCount = n => `${n} ${n % 100 >= 11 && n % 100 <= 14 ? 'фильмов' : n % 10 === 1 ? 'фильм' : n % 10 >= 2 && n % 10 <= 4 ? 'фильма' : 'фильмов'}`;

export const createCatalogPage = navigate => {
  const page = document.createElement('div');
  page.className = 'catalog-page';
  const container = document.createElement('div');
  container.className = 'catalog-container';
  const main = document.createElement('main');
  container.append(main);
  page.append(...createSidebar(page, container, navigate), container);
  return { page, main };
};

export const sectionHeading = (title, { link, href, count, level = 2 } = {}) => {
  const heading = document.createElement('div');
  heading.className = 'catalog-heading';
  const h2 = document.createElement(`h${level}`);
  const star = document.createElement('img');
  star.src = homeAsset('section-star');star.width = 22;star.height = 22;star.alt = '';
  h2.append(star, document.createTextNode(title));heading.append(h2);
  if (link) {
    const a = document.createElement('a');a.href = href;a.dataset.link = '';a.textContent = link;heading.append(a);
  } else if (count !== undefined) {
    const span = document.createElement('span');span.textContent = count;span.className = 'catalog-count';heading.append(span);
  }
  return heading;
};

export const createStatus = text => {
  const status = document.createElement('p');status.className = 'catalog-status';status.setAttribute('role', 'status');status.textContent = text;return status;
};
export const showLoadError = (status, retry, message = 'Не удалось загрузить данные.') => {
  status.replaceChildren(document.createTextNode(`${message} `));
  const button = document.createElement('button');button.type = 'button';button.className = 'catalog-retry';button.textContent = 'Попробовать ещё раз';button.addEventListener('click', retry);status.append(button);
};

const posterImage = (movie, className = '') => {
  const img = document.createElement('img');img.src = getMoviePoster(movie) || '';img.alt = '';img.className = className;img.decoding = 'async';img.loading = 'lazy';
  img.addEventListener('error', () => { img.hidden = true;img.parentElement.classList.add('poster-unavailable'); });return img;
};

export const createPosterStack = films => {
  const stack = document.createElement('div');stack.className = 'poster-stack';stack.setAttribute('aria-hidden', 'true');
  films.slice(0, 3).forEach(movie => { const frame = document.createElement('div');frame.className = 'poster-stack__frame';frame.append(posterImage(movie));stack.append(frame); });
  return stack;
};

export const createCollectionCard = collection => {
  const card = document.createElement('a');card.className = 'collection-card';card.href = `/collections?id=${collection.id}`;card.dataset.link = '';
  const text = document.createElement('div');text.className = 'collection-card__text';
  const count = document.createElement('span');count.className = 'collection-card__count';count.textContent = filmCount(collection.films.length);
  const title = document.createElement('h3');title.textContent = collection.title;
  const description = document.createElement('p');description.textContent = collection.description || '';
  text.append(count, title, description);card.append(text, createPosterStack(collection.films));return card;
};

export const createMovieTile = (movie, page) => {
  const tile = document.createElement('a');tile.href = `/film/${movie.id}`;tile.dataset.link = '';tile.className = 'movie-tile';tile.setAttribute('aria-label', `О фильме: ${movie.title}`);
  const cover = document.createElement('span');cover.className = 'movie-tile__cover';cover.append(posterImage(movie));
  const rating = document.createElement('span');rating.className = 'movie-tile__rating';rating.textContent = `★ ${Number.isFinite(movie.rating) ? movie.rating.toFixed(1) : '—'}`;
  if (!Number.isFinite(movie.rating)) rating.classList.add('movie-tile__rating--unavailable');
  cover.append(rating);
  const title = document.createElement('span');title.className = 'movie-tile__title';title.textContent = movie.title;title.title = movie.title;
  const meta = document.createElement('span');meta.className = 'movie-tile__meta';meta.textContent = [movie.year, movie.type === 'series' ? 'Сериал' : 'Фильм'].filter(Boolean).join(' · ');
  const description = document.createElement('span');description.className = 'movie-tile__description';description.textContent = movie.description;
  tile.append(cover, title, meta, description);
  const shell = document.createElement('div');shell.className = 'movie-tile-shell';
  const actions = document.createElement('div');actions.className = 'movie-tile-actions';actions.setAttribute('role', 'group');actions.setAttribute('aria-label', `Действия с фильмом «${movie.title}»`);
  actions.append(createMovieListButton(movie, page, 'favorite'), createMovieListButton(movie, page, 'watchlater'));
  const personal = createPersonalLibraryButton(movie, page);if (personal) actions.append(personal);shell.append(tile, actions);return shell;
};
