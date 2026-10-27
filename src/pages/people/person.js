import { createCatalogPage, createMovieTile, filmCount } from '../discover/catalog-ui.js';
import { getCatalog } from '../../services/catalog-cache.js';
import { NotFoundPage } from '../not-found/not-found.js';
import { formatPremiere, getFilmFacts } from '../../data/film-facts.js';
import { actorPath } from '../../services/actor-links.js';
import { element, skeletons, showRetry } from '../film/film-ui.js';
import { pageLink, portrait, emptyState, onPageRemoved } from './people-ui.js';

// Страница режиссёра или продюсера: /director/:name, /producer/:name.
// Фильмография строится по каталогу Frame: режиссура (и «создатель» у сериалов), продюсирование,
// сценарии, роли — вкладками; открыта вкладка той роли, по ссылке на которую пришли.

const ROLES = {
  director: { tab: 'Режиссура', eyebrow: 'Режиссёр', title: 'Режиссёр' },
  producer: { tab: 'Продюсирование', eyebrow: 'Продюсер', title: 'Продюсер' },
  writer: { tab: 'Сценарии', eyebrow: 'Сценарист', title: 'Сценарист' },
  actor: { tab: 'Роли', eyebrow: 'Актёр', title: 'Актёр' },
};

const lifeYears = bio => {
  const birth = bio?.birthDate ? formatPremiere(bio.birthDate) : '';
  if (bio?.deathYear) return { label: 'Годы жизни', value: `${birth || '?'} — ${bio.deathYear}` };
  return birth ? { label: 'Дата рождения', value: birth } : null;
};

export class PersonPage {
  constructor({ navigate, params }) { this.navigate = navigate;this.params = params; }
  render() {
    const role = location.pathname.split('/')[1] === 'producer' ? 'producer' : 'director';
    let raw;try { raw = decodeURIComponent(this.params.name); }catch { return new NotFoundPage({ navigate: this.navigate }).render(); }
    if (!raw || raw.length > 160) return new NotFoundPage({ navigate: this.navigate }).render();
    const { page, main } = createCatalogPage(this.navigate);main.className = 'people-page actor-page person-page';
    let disposed = false;onPageRemoved(page, () => { disposed = true; });
    const load = async () => {
      main.classList.remove('discussion-load-error');skeletons(main, 2);
      try {
        const [{ getFilmCredits }, { normalizePersonName, findPersonBio, getFilmProducers }, catalog] = await Promise.all([
          import('../../data/film-credits.js'), import('../../data/people.js'), getCatalog(),
        ]);
        if (disposed || !page.isConnected) return;
        const name = normalizePersonName(raw);
        const same = value => normalizePersonName(value) === name;
        const works = { director: [], producer: [], writer: [], actor: [] };
        for (const movie of catalog) {
          const credits = getFilmCredits(movie);
          if (credits?.directors?.some(same)) works.director.push(movie);
          if (getFilmProducers(movie).some(same)) works.producer.push(movie);
          if (getFilmFacts(movie)?.writers?.some(same)) works.writer.push(movie);
          if (credits?.cast?.some(person => same(person.name))) works.actor.push(movie);
        }
        if (!works[role].length) { page.replaceWith(new NotFoundPage({ navigate: this.navigate }).render());return; }
        const bio = findPersonBio(name);
        document.title = `${name} — ${ROLES[role].title.toLowerCase()} — Frame`;

        const hero = element('header', 'person-hero actor-hero');const copy = element('div', 'person-hero__copy');
        const roles = Object.keys(ROLES).filter(key => works[key].length);
        const eyebrow = [role, ...roles.filter(key => key !== role)].map(key => ROLES[key].eyebrow).join(' · ');
        copy.append(pageLink('← К фильмам', '/films', 'person-back'), element('p', 'film-eyebrow', eyebrow), element('h1', '', name));
        if (bio?.originalName) { const original = element('p', 'person-original', bio.originalName);original.lang = 'en';copy.append(original); }
        const summary = roles.map(key => `${ROLES[key].tab.toLowerCase()} — ${works[key].length}`).join(', ');
        const total = new Set(roles.flatMap(key => works[key].map(movie => movie.id))).size;
        copy.append(element('p', 'person-intro', `В каталоге Frame — ${filmCount(total)}: ${summary}.`));
        const facts = element('dl', 'person-facts');
        const years = lifeYears(bio);
        for (const [label, value] of [[years?.label, years?.value], ['Место рождения', bio?.birthplace], ['Гражданство', bio?.countries?.join(', ')]]) {
          if (!label || !value) continue;const row = element('div');row.append(element('dt', '', label), element('dd', '', value));facts.append(row);
        }
        if (facts.childElementCount) copy.append(facts);
        // Справочник актёров большой — подгружаем его, только если человек снимался в фильмах каталога.
        if (works.actor.length) {
          const { findActor } = await import('../../data/actors.js');
          if (disposed || !page.isConnected) return;
          if (findActor(name)) copy.append(pageLink('Страница актёра →', actorPath(name), 'person-role-link'));
        }
        hero.append(portrait(name, bio?.image), copy);

        const section = element('section', 'actor-filmography');section.setAttribute('aria-labelledby', 'person-filmography-title');
        const head = element('div', 'people-section-head');const heading = element('h2', '', 'Фильмография в Frame');heading.id = 'person-filmography-title';head.append(heading);
        const toolbar = element('div', 'people-toolbar');const tabs = element('div', 'people-tabs');tabs.setAttribute('role', 'group');tabs.setAttribute('aria-label', 'Роль в фильме');
        const results = element('div', 'people-movies');results.setAttribute('aria-live', 'polite');let selected = role;
        const renderFilms = () => {
          for (const button of tabs.children) button.setAttribute('aria-pressed', String(button.dataset.role === selected));
          const movies = [...works[selected]].sort((a, b) => (b.year - a.year) || a.title.localeCompare(b.title, 'ru'));
          if (!movies.length) { results.replaceChildren(emptyState('Пока пусто', 'Здесь появятся фильмы, когда их добавят в Frame.', null));return; }
          const grid = element('div', 'people-movie-grid');grid.append(...movies.map(movie => createMovieTile(movie, page)));results.replaceChildren(grid);
        };
        for (const key of [role, ...roles.filter(item => item !== role)]) {
          const button = element('button', '', `${ROLES[key].tab} · ${works[key].length}`);button.type = 'button';button.dataset.role = key;
          button.addEventListener('click', () => { selected = key;renderFilms(); });tabs.append(button);
        }
        toolbar.append(tabs);section.append(head, toolbar, results);
        main.replaceChildren(hero, section);main.removeAttribute('aria-busy');main.removeAttribute('aria-label');renderFilms();
      } catch { if (!disposed && page.isConnected) showRetry(main, 'Не удалось загрузить страницу.', load); }
    };
    void load();return page;
  }
}
