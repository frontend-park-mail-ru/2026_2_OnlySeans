import { requireElement } from '../../core/component.js';
import type { Profile, ProfileFilm } from '../../api/profile.js';
import { assetUrl } from '../../api/http.js';
import { readLibrary } from '../../services/library.js';
import { countLabel } from '../../core/format.js';

const node = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className?: string,
  text: string | number = '',
) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = String(text);
  return element;
};

const filmLink = (film: ProfileFilm, className: string) => {
  const link = node('a', className);
  link.href = '/film/' + encodeURIComponent(film.id);
  link.dataset.link = '';
  return link;
};

function cover(film: ProfileFilm) {
  const poster = node('div', 'profile-page__poster');
  if (film.poster) {
    const image = node('img');
    image.alt = '';
    image.loading = 'lazy';
    image.src = assetUrl(film.poster);
    image.addEventListener('error', () => image.remove(), { once: true });
    poster.append(image);
  }
  return poster;
}

function favoriteTile(film: ProfileFilm) {
  const tile = filmLink(film, 'profile-page__tile');
  const poster = cover(film);
  const badges = node('div', 'profile-page__poster-badges');
  badges.append(node('span', '', film.average ? '★ ' + film.average.toFixed(1) : '★ —'));
  badges.append(node('span', '', film.age_limit + '+'));
  poster.append(badges);
  tile.append(
    poster,
    node('h3', '', film.title),
    node('p', '', [film.year, film.genres].filter(Boolean).join(' · ')),
  );
  return tile;
}

function ratingRow(film: ProfileFilm) {
  const row = filmLink(film, 'profile-page__rating');
  const info = node('div', 'profile-page__rating-info');
  info.append(
    node('h3', '', film.title),
    node(
      'p',
      '',
      [film.type === 'series' ? 'Сериал' : 'Фильм', film.genres].filter(Boolean).join(' · '),
    ),
  );
  const score = node(
    'span',
    'profile-page__rating-score',
    'Моя ' + film.score + (film.average ? ' · ★ ' + film.average.toFixed(1) : '') + '　→',
  );
  row.append(node('span', 'profile-page__rating-year', film.year), cover(film), info, score);
  return row;
}

export function renderProfileLibrary(
  page: HTMLElement,
  { user, favorites, ratings, reviews }: Profile,
) {
  const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
    requireElement<T>(page, selector);
  const date = Number.isFinite(Date.parse(user.created_at))
    ? new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow' }).format(
        new Date(user.created_at),
      )
    : '—';
  find('[data-profile-date]').textContent = date;
  find('[data-profile-watched-total]').textContent = String(readLibrary().watched.length);
  find('[data-profile-watched-mobile]').textContent = String(readLibrary().watched.length);
  find('[data-profile-later-total]').textContent = String(readLibrary().watchlater.length);
  const scores = ratings
    .map((film) => film.score)
    .filter((score): score is number => typeof score === 'number' && score >= 1 && score <= 10);
  find('[data-profile-average]').textContent = scores.length
    ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toLocaleString('ru', {
        maximumFractionDigits: 1,
      })
    : '—';
  find('[data-profile-since]').textContent = 'Профиль · на Frame с ' + date;
  find('[data-profile-rating-total]').textContent = String(ratings.length);
  find('[data-profile-review-total]').textContent = String(reviews);
  find('[data-profile-review-mobile]').textContent = String(reviews);
  find('[data-profile-favorite-total]').textContent = String(favorites.length);
  find('[data-profile-favorite-count]').textContent = countLabel(favorites.length, [
    'фильм',
    'фильма',
    'фильмов',
  ]);
  find('[data-profile-rating-count]').textContent = countLabel(ratings.length, [
    'оценка',
    'оценки',
    'оценок',
  ]);
  find('[data-profile-favorites-list]').replaceChildren(...favorites.map(favoriteTile));
  find('[data-profile-ratings-list]').replaceChildren(...ratings.map(ratingRow));
  find<HTMLElement>('[data-profile-favorites-empty]').hidden = favorites.length > 0;
  find<HTMLElement>('[data-profile-ratings]').hidden = ratings.length === 0;
  find<HTMLElement>('[data-profile-library-status]').hidden = true;
}
