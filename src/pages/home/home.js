import { BaseComponent } from '../../components/ui/base-component.js';
import { renderTemplate } from '../../components/ui/render-template.js';
import { createButton } from '../../components/ui/button/button.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { coverProps, watchCovers } from '../../components/ui/film-cover/film-cover.js';
import { createFilmGrid } from '../../components/ui/film-tile/film-tile.js';
import { getCollections } from '../../api/movies.js';
import { collectGenres, countLabel } from '../../services/movies.js';

const ROW_SIZE = 7;
const HERO_COVERS = 3;

const template = window.Handlebars.compile(`
  <div class="home">
    <p class="page-status" role="status">Загружаем подборки…</p>
    <div class="home__content"></div>
  </div>
`);

const heroTemplate = window.Handlebars.compile(`
  <section class="hero">
    <div class="hero__text">
      <p class="hero__label">Подборка недели</p>
      <h1 class="hero__title">{{title}}</h1>
      <p class="hero__description">{{description}}</p>
      <p class="hero__meta">{{meta}}</p>
      <div class="hero__actions"></div>
    </div>
    <div class="hero__art" aria-hidden="true">
      {{#each covers}}<div class="hero__cover">{{> filmCover this}}</div>{{/each}}
    </div>
  </section>
`);

const rowTemplate = window.Handlebars.compile(`
  <section class="home__row">
    <h2 class="section-title"><a href="/collection?id={{id}}" data-link>{{title}} ›</a></h2>
  </section>
`);

export class HomePage extends BaseComponent {
  constructor({ navigate }) {
    super(template, {});
    this.navigate = navigate;
  }

  render() {
    document.title = 'Главная — Frame';

    const content = this.create();
    loadData(content, getCollections(), (collections) => this.show(content, collections));

    return createPageShell({ navigate: this.navigate, content });
  }

  show(content, collections) {
    const filled = collections.filter((collection) => collection.movies.length);
    if (!filled.length) {
      content.querySelector('.page-status').textContent = 'Подборок пока нет.';
      return;
    }

    const rows = filled.map((collection) => {
      const row = renderTemplate(rowTemplate, collection);
      row.appendChild(createFilmGrid(collection.movies.slice(0, ROW_SIZE)));
      return row;
    });

    content.querySelector('.home__content').replaceChildren(this.createHero(filled[0]), ...rows);
  }

  createHero(collection) {
    const hero = renderTemplate(heroTemplate, {
      title: collection.title,
      description: collection.description,
      meta: [countLabel(collection.movies), ...collectGenres(collection.movies).slice(0, 3)].join(' · '),
      covers: collection.movies.slice(0, HERO_COVERS).map(coverProps),
    });
    watchCovers(hero);

    const openButton = createButton({ text: 'Смотреть подборку' });
    const allButton = createButton({ text: 'Все подборки', variant: 'secondary' });
    openButton.addEventListener('click', () => this.navigate(`/collection?id=${collection.id}`));
    allButton.addEventListener('click', () => this.navigate('/collections'));
    hero.querySelector('.hero__actions').append(openButton, allButton);

    return hero;
  }
}
