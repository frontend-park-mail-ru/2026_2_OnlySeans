import { actorPath, personPath } from '../../services/actor-links.js';
import { getFilmRelations } from '../../data/film-relations.js';
import { getVersionPoster } from '../../data/film-version-posters.js';
import { getMovies } from '../../api/movies.js';
import { getMoviePoster } from '../../services/posters.js';
import { createMovieTile } from '../discover/catalog-ui.js';
import { skeletons, showRetry } from './film-ui.js';
import { element } from '../../utils/dom.js';
import { createAudienceRose } from './audience-rose.js';
import { createScrollRow } from './scroll-row.js';
import { formatPremiere, getFilmFacts, getFilmVersions } from '../../data/film-facts.js';

export const enhanceFilmHero = (hero, movie) => {
  hero.classList.add('film-hero--profile');
  const backdrop = element('img', 'film-profile-backdrop');
  backdrop.src = getMoviePoster(movie);
  backdrop.alt = '';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.addEventListener('error', () => backdrop.remove(), { once: true });
  hero.prepend(backdrop);
  const info = hero.querySelector('.film-hero__info');
  hero.querySelector('.film-hero__poster')?.remove();
  const text = movie.description || 'Описание пока не добавлено.';
  const shortText = text.length > 190 ? `${text.slice(0, 190).replace(/\s+\S*$/, '')}…` : text;
  const preview = element('p', 'film-profile-preview', shortText);
  const more = element('a', 'film-profile-preview-more', 'Подробнее');
  more.href = '#film-description';
  more.addEventListener('click', (event) => {
    event.preventDefault();
    const description = hero.parentElement.querySelector('#film-description');
    description?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'center',
    });
  });
  info.querySelector('.film-hero__meta').after(preview, more);
  for (const item of info.querySelectorAll('.film-hero__meta span')) {
    if (['Фильм', 'Сериал'].includes(item.textContent)) item.remove();
  }
  const labels = ['Нравится', 'Смотреть позже', 'Моё кино'];
  info.querySelectorAll('.film-hero__actions button').forEach((button, index) => {
    button.append(element('span', 'film-profile-action-label', labels[index]));
  });
  const actions = info.querySelector('.film-hero__actions');
  actions.prepend(actions.querySelector('.movie-list-button--watchlater'));
};

// Плашки имён; с role — ссылки на страницу режиссёра/продюсера.
const chips = (names, role = '', normalize = (name) => name) =>
  names.map((raw) => {
    const name = normalize(raw);
    if (!role) return element('span', 'film-profile-credit-chip', name);
    const link = element('a', 'film-profile-credit-chip film-profile-credit-chip--link', name);
    link.href = personPath(role, name);
    link.dataset.link = '';
    return link;
  });

const createStory = (movie, credits, facts, people = null) => {
  const section = element('section', 'film-profile-story');
  section.setAttribute('aria-labelledby', 'film-story-title');
  const story = element('div', 'film-profile-synopsis');
  const heading = element('h2', '', 'Описание');
  heading.id = 'film-story-title';
  const description = element(
    'p',
    'film-profile-description',
    movie.description || 'Описание пока не добавлено.',
  );
  description.id = 'film-description';
  story.append(heading, description);
  const details = element('aside', 'film-profile-details');
  details.setAttribute('aria-label', 'Сведения о фильме');
  const factList = element('dl');
  const countries = credits?.countries || [];
  const directors = credits?.directors || [];
  const writers = facts?.writers || [];
  const producers = people?.getFilmProducers(movie) || [];
  const normalize = people?.normalizePersonName || ((name) => name);
  const world = formatPremiere(facts?.worldPremiere);
  const russia = formatPremiere(facts?.russiaPremiere);
  const premiere =
    [world && `${world} в мире`, russia && `${russia} ${facts.russiaLabel}`]
      .filter(Boolean)
      .join('; ') || (movie.year ? String(movie.year) : '');
  const genres = (movie.genres || [])
    .filter(Boolean)
    .map((genre) => genre.toLocaleLowerCase('ru'))
    .join(', ');
  const names = element('span', 'film-profile-names');
  names.append(element('span', '', movie.title));
  if (facts?.englishTitle) {
    const english = element('span', '', facts.englishTitle);
    english.lang = 'en';
    names.append(english);
  }
  let premiereLabel = movie.type === 'series' ? 'Год выхода' : 'Год';
  if (world || russia) premiereLabel = 'Премьера';
  let directorsLabel = directors.length > 1 ? 'Режиссёры' : 'Режиссёр';
  if (credits?.creators) directorsLabel = 'Создатели';
  const rows = [
    [premiereLabel, premiere, 'premiere'],
    ['Жанры', genres, 'genres'],
    [countries.length > 1 ? 'Страны' : 'Страна', countries.join(', '), 'countries'],
    ['Полное название', [names], 'names'],
    [
      directorsLabel,
      directors.length ? chips(directors, 'director', normalize) : null,
      'directors',
    ],
    [
      producers.length > 1 ? 'Продюсеры' : 'Продюсер',
      producers.length ? chips(producers, 'producer') : null,
      'producers',
    ],
    ['Сценарий', writers.length ? chips(writers) : null, 'writers'],
  ];
  for (const [label, value, key] of rows) {
    if (!value) continue;
    const row = element('div');
    row.dataset.fact = key;
    const valueNode = element('dd');
    if (Array.isArray(value)) valueNode.append(...value);
    else valueNode.textContent = value;
    if (['directors', 'producers', 'writers'].includes(key)) {
      valueNode.className = 'film-profile-chip-row';
      // Колесо мыши листает ряд плашек по горизонтали, если он не помещается.
      valueNode.addEventListener(
        'wheel',
        (event) => {
          if (
            valueNode.scrollWidth <= valueNode.clientWidth ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
          )
            return;
          const max = valueNode.scrollWidth - valueNode.clientWidth;
          if (
            (event.deltaY < 0 && valueNode.scrollLeft <= 0) ||
            (event.deltaY > 0 && valueNode.scrollLeft >= max)
          )
            return;
          event.preventDefault();
          valueNode.scrollLeft += event.deltaY;
        },
        { passive: false },
      );
    }
    row.append(element('dt', '', label), valueNode);
    factList.append(row);
  }
  details.append(factList);
  section.append(details, story);
  return section;
};

const createCast = (credits) => {
  if (!credits?.cast?.length) return null;
  const section = element('section', 'film-profile-cast');
  section.setAttribute('aria-labelledby', 'film-cast-title');
  const heading = element('h2', '', credits.voiceCast ? 'Роли озвучивали' : 'В ролях');
  heading.id = 'film-cast-title';
  const list = element('ul', 'film-profile-people');
  for (const person of credits.cast) {
    const item = element('li', 'film-profile-person');
    const portrait = element('div', 'film-profile-portrait');
    const initials = person.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
    const fallback = element('span', 'film-profile-initials', initials);
    fallback.setAttribute('aria-hidden', 'true');
    portrait.append(fallback);
    if (person.image) {
      const image = element('img', 'film-profile-photo');
      image.alt = person.name;
      image.loading = 'lazy';
      image.width = 240;
      image.height = 300;
      image.addEventListener('load', () => portrait.classList.add('has-photo'), { once: true });
      image.addEventListener(
        'error',
        () => {
          image.remove();
          portrait.classList.remove('has-photo');
        },
        { once: true },
      );
      image.src = person.image;
      portrait.append(image);
    }
    const link = element('a', 'film-profile-actor-link');
    link.href = actorPath(person.name);
    link.dataset.link = '';
    link.append(portrait, element('span', 'film-profile-person-name', person.name));
    item.append(link);
    list.append(item);
  }
  section.append(heading, createScrollRow(list, { label: 'актёры' }));
  return section;
};

const createFilmRow = (entries, page, { title, key, hint }) => {
  const section = element('section', `film-profile-${key}`);
  section.setAttribute('aria-labelledby', `film-${key}-title`);
  const heading = element('h2', '', title);
  heading.id = `film-${key}-title`;
  section.append(heading);
  if (hint) section.append(element('p', 'film-profile-section-hint', hint));
  const list = element('ul', 'film-profile-related-grid film-connections-list');
  for (const entry of entries) {
    const item = element('li', `film-connection${entry.current ? ' is-current' : ''}`);
    if (entry.movie) {
      const tile = createMovieTile(entry.movie, page);
      // текущий фильм выделен рамкой вокруг постера (стиль .film-connection.is-current)
      if (entry.current) tile.querySelector('.movie-tile').setAttribute('aria-current', 'page');
      item.append(tile);
    } else {
      const card = element('article', 'movie-tile film-connection__unavailable');
      const cover = element('div', 'movie-tile__cover');
      const fallback = element('span', 'film-connection__placeholder', 'Постер пока не добавлен');
      cover.append(fallback);
      const poster = getVersionPoster(entry) || entry.poster;
      if (poster) {
        const image = element('img');
        image.src = poster;
        image.alt = `Постер: ${entry.title}`;
        image.loading = 'lazy';
        image.addEventListener(
          'load',
          () => {
            fallback.hidden = true;
          },
          { once: true },
        );
        image.addEventListener('error', () => image.remove(), { once: true });
        cover.append(image);
      }
      card.append(
        cover,
        element('h3', 'movie-tile__title', entry.title),
        element('p', 'movie-tile__meta', String(entry.year)),
        element('p', 'film-connection__note', entry.note || 'Версия фильма'),
        element('span', 'film-connection__status', 'Нет в каталоге'),
      );
      item.append(card);
    }
    list.append(item);
  }
  section.append(createScrollRow(list, { label: title.toLowerCase() }));
  return section;
};

export const createFilmProfile = async ({ movie, page, signal, hero }) => {
  const [{ getFilmCredits }, people] = await Promise.all([
    import('../../data/film-credits.js'),
    import('../../data/people.js').catch(() => null),
  ]);
  if (signal.aborted || !page.isConnected) return null;
  const profile = element('div', 'film-profile');
  const credits = getFilmCredits(movie);
  const facts = getFilmFacts(movie);
  const meta = hero.querySelector('.film-hero__meta');
  if (credits?.countries?.length)
    meta.firstElementChild?.after(element('span', '', credits.countries.join(', ')));
  if (facts?.englishTitle && !hero.querySelector('.film-hero__original')) {
    const original = element('p', 'film-hero__original', facts.englishTitle);
    original.lang = 'en';
    hero.querySelector('h1')?.after(original);
  }
  hero.after(createStory(movie, credits, facts, people));
  profile.append(createAudienceRose({ movie, signal }));
  const cast = createCast(credits);
  if (cast) profile.append(cast);
  const versionsSlot = element('div', 'film-profile-versions-slot');
  versionsSlot.hidden = true;
  profile.append(versionsSlot);
  const relationsSlot = element('div', 'film-profile-relations');
  relationsSlot.hidden = true;
  profile.append(relationsSlot);
  const related = element('section', 'film-profile-related');
  related.setAttribute('aria-labelledby', 'film-related-title');
  const heading = element('h2', '', 'Похожие фильмы и сериалы');
  heading.id = 'film-related-title';
  const results = element('div', 'film-profile-related-results');
  related.append(heading, results);
  profile.append(related);
  const loadRelated = async () => {
    results.classList.remove('discussion-load-error');
    skeletons(results, 1);
    try {
      const movies = await getMovies({ signal });
      if (signal.aborted || !profile.isConnected) return;
      const relations = getFilmRelations(movie, movies);
      const relatedIDs = new Set(
        [...relations.prequels, ...relations.sequels].map((item) => item.id),
      );
      const versions = getFilmVersions(movie, movies).filter(
        (version) => !relatedIDs.has(version.id),
      );
      if (versions.length > 1) {
        const illustrated = versions.map((version) => ({
          ...version,
          poster:
            /версия/i.test(version.note || '') && version.title.startsWith(movie.title)
              ? getMoviePoster(movie)
              : '',
        }));
        versionsSlot.replaceChildren(
          createFilmRow(illustrated, page, {
            title: 'Версии фильма',
            key: 'versions',
            hint: 'Экранизации, ремейки и другие монтажные версии этой истории.',
          }),
        );
        versionsSlot.hidden = false;
      }
      relationsSlot.replaceChildren();
      for (const [key, title] of [
        ['prequels', 'Приквелы'],
        ['sequels', 'Сиквелы'],
      ]) {
        if (relations[key].length)
          relationsSlot.append(
            createFilmRow(
              relations[key].map((item) => ({ movie: item })),
              page,
              { title, key },
            ),
          );
      }
      relationsSlot.hidden = !relationsSlot.childElementCount;
      const versionIds = new Set(versions.map((version) => version.id).filter(Boolean));
      const score = (candidate) => {
        const shared = candidate.genres.filter((genre) => movie.genres.includes(genre)).length;
        const candidateCredits = getFilmCredits(candidate);
        const sameDirector = credits?.directors?.some((name) =>
          candidateCredits?.directors?.includes(name),
        );
        return (
          shared * 20 +
          (sameDirector ? 16 : 0) +
          (candidate.type === movie.type ? 8 : 0) -
          Math.min(Math.abs(candidate.year - movie.year), 50) / 10
        );
      };
      const similar = movies
        .filter(
          (candidate) =>
            candidate.id !== movie.id &&
            !versionIds.has(candidate.id) &&
            !relatedIDs.has(candidate.id),
        )
        .sort((a, b) => score(b) - score(a) || a.id - b.id)
        .slice(0, 18);
      const grid = element('div', 'film-profile-related-grid');
      grid.append(...similar.map((candidate) => createMovieTile(candidate, page)));
      results.replaceChildren(
        similar.length
          ? createScrollRow(grid, { label: 'фильмы' })
          : element('p', 'film-muted', 'Другие фильмы скоро появятся в каталоге.'),
      );
      results.removeAttribute('aria-busy');
      results.removeAttribute('aria-label');
    } catch {
      if (!signal.aborted && profile.isConnected)
        showRetry(results, 'Не удалось загрузить похожие фильмы.', loadRelated);
    }
  };
  void loadRelated();
  return profile;
};
