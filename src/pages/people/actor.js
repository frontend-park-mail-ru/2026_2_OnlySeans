import { createCatalogPage, createMovieTile, filmCount } from '../discover/catalog-ui.js';
import { getCatalog } from '../../services/catalog-cache.js';
import { NotFoundPage } from '../not-found/not-found.js';
import { formatPremiere } from '../../data/film-facts.js';
import { element, skeletons, showRetry } from '../film/film-ui.js';
import { pageLink, portrait, emptyState, onPageRemoved } from './people-ui.js';

export class ActorPage {
  constructor({navigate, params}) { this.navigate = navigate;this.params = params; }
  render() {
    let name;try { name = decodeURIComponent(this.params.name); }catch { return new NotFoundPage({navigate:this.navigate}).render(); }
    if (!name || name.length > 160) return new NotFoundPage({navigate:this.navigate}).render();
    const {page, main} = createCatalogPage(this.navigate);main.className = 'people-page actor-page';
    document.title = `${name} — Frame`;let disposed = false;
    onPageRemoved(page, () => { disposed = true; });
    const load = async () => {
      main.classList.remove('discussion-load-error');skeletons(main, 2);
      try {
        const [{findActor}, {getFilmCredits}, catalog] = await Promise.all([import('../../data/actors.js'), import('../../data/film-credits.js'), getCatalog()]);
        if (disposed || !page.isConnected) return;
        const actor = findActor(name);if (!actor) { page.replaceWith(new NotFoundPage({navigate:this.navigate}).render());return; }
        const films = catalog.filter(movie => getFilmCredits(movie)?.cast.some(person => person.name === name));
        const hero = element('header', 'person-hero actor-hero');const copy = element('div', 'person-hero__copy');
        copy.append(pageLink('← К фильмам', '/films', 'person-back'), element('p', 'film-eyebrow', 'Лица кино'), element('h1', '', name));
        if (actor.originalName && actor.originalName !== name) { const original = element('p', 'person-original', actor.originalName);original.lang = 'en';copy.append(original); }
        copy.append(element('p', 'person-intro', `В каталоге Frame — ${filmCount(films.length)}.`));
        const facts = element('dl', 'person-facts');
        for (const [label, value] of [['Дата рождения',formatPremiere(actor.birthDate)], ['Место рождения',actor.birthplace], ['Гражданство',actor.countries.join(', ')]]) {
          if (!value) continue;const row = element('div');row.append(element('dt', '', label), element('dd', '', value));facts.append(row);
        }
        copy.append(facts);hero.append(portrait(name, actor.image), copy);
        const section = element('section', 'actor-filmography');section.setAttribute('aria-labelledby', 'actor-filmography-title');
        const head = element('div', 'people-section-head');const heading = element('h2', '', 'Фильмография в Frame');heading.id = 'actor-filmography-title';head.append(heading);
        const toolbar = element('div', 'people-toolbar');const filters = element('div', 'people-tabs');filters.setAttribute('role', 'group');filters.setAttribute('aria-label', 'Тип фильмографии');
        const results = element('div', 'people-movies');results.setAttribute('aria-live', 'polite');let selected = 'all';
        const renderFilms = () => {
          const movies = films.filter(movie => selected === 'all' || movie.type === selected).sort((a,b) => (b.year - a.year) || a.title.localeCompare(b.title, 'ru'));
          for (const button of filters.children) button.setAttribute('aria-pressed', String(button.dataset.type === selected));
          if (!movies.length) results.replaceChildren(emptyState('Пока нет фильмов в этом разделе', 'Фильмография показывает работы, которые уже добавлены в Frame.', null));
          else { const grid = element('div', 'people-movie-grid');grid.append(...movies.map(movie => createMovieTile(movie, page)));results.replaceChildren(grid); }
        };
        for (const [type,label] of [['all','Всё'], ['movie','Фильмы'], ['series','Сериалы']]) {
          const count = type === 'all' ? films.length : films.filter(movie => movie.type === type).length;
          const button = element('button', '', `${label} · ${count}`);button.type = 'button';button.dataset.type = type;button.addEventListener('click', () => { selected = type;renderFilms(); });filters.append(button);
        }
        toolbar.append(filters);section.append(head, toolbar, results);
        main.replaceChildren(hero, section);main.removeAttribute('aria-busy');main.removeAttribute('aria-label');renderFilms();
      } catch { if (!disposed && page.isConnected) showRetry(main, 'Не удалось загрузить страницу актёра.', load); }
    };
    void load();return page;
  }
}
