import type { Profile, ProfileFilm } from '../../api/profile.js';
import { assetUrl } from '../../api/http.js';
import { countLabel } from '../../core/format.js';

const node = <Tag extends keyof HTMLElementTagNameMap>(tag: Tag, className?: string, text: string | number = '') => {
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
    node('p', '', [film.year, film.genres].filter(Boolean).join(' · '))
  );
  return tile;
}

function ratingRow(film: ProfileFilm) {
  const row = filmLink(film, 'profile-page__rating');
  const info = node('div', 'profile-page__rating-info');
  info.append(
    node('h3', '', film.title),
    node('p', '', [film.type === 'series' ? 'Сериал' : 'Фильм', film.genres]
      .filter(Boolean).join(' · '))
  );
  const score = node(
    'span',
    'profile-page__rating-score',
    'Моя ' + film.score + (film.average ? ' · ★ ' + film.average.toFixed(1) : '') + '　→'
  );
  row.append(node('span', 'profile-page__rating-year', film.year), cover(film), info, score);
  return row;
}

export function renderProfileLibrary(page: HTMLElement, { user, favorites, ratings, reviews }: Profile) {
  const date = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow' }).format(
    new Date(user.created_at)
  );
  page.querySelector('[data-profile-date]').textContent = date;
  page.querySelector('[data-profile-since]').textContent = 'Профиль · на Frame с ' + date;
  page.querySelector('[data-profile-rating-total]').textContent = String(ratings.length);
  page.querySelector('[data-profile-review-total]').textContent = String(reviews);
  page.querySelector('[data-profile-favorite-total]').textContent = String(favorites.length);
  page.querySelector('[data-profile-favorite-count]').textContent = countLabel(
    favorites.length,
    ['фильм', 'фильма', 'фильмов']
  );
  page.querySelector('[data-profile-rating-count]').textContent = countLabel(
    ratings.length,
    ['оценка', 'оценки', 'оценок']
  );
  page.querySelector('[data-profile-favorites-list]').replaceChildren(...favorites.map(favoriteTile));
  page.querySelector('[data-profile-ratings-list]').replaceChildren(...ratings.map(ratingRow));
  page.querySelector<HTMLElement>('[data-profile-favorites-empty]').hidden = favorites.length > 0;
  page.querySelector<HTMLElement>('[data-profile-ratings]').hidden = ratings.length === 0;
  page.querySelector<HTMLElement>('[data-profile-library-status]').hidden = true;
}
