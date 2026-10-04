import { BaseComponent } from '../../components/ui/base-component.js';
import { renderTemplate } from '../../components/ui/render-template.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { coverProps, watchCovers } from '../../components/ui/film-cover/film-cover.js';
import { getCollections } from '../../api/movies.js';
import { countLabel } from '../../services/movies.js';

const template = window.Handlebars.compile(`
  <div class="collections">
    <h1 class="page-title">Подборки</h1>
    <p class="page-status" role="status">Загружаем подборки…</p>
    <div class="collections__list"></div>
  </div>
`);

const rowTemplate = window.Handlebars.compile(`
  <a class="collection-row" href="/collection?id={{id}}" data-link>
    <span class="collection-row__cover">{{> filmCover cover}}</span>
    <span class="collection-row__info">
      <span class="collection-row__title">{{title}}</span>
      <span class="collection-row__text">{{description}}</span>
    </span>
    <span class="collection-row__count">{{count}}</span>
  </a>
`);

export class CollectionsPage extends BaseComponent {
  constructor({ navigate }) {
    super(template, {});
    this.navigate = navigate;
  }

  render() {
    document.title = 'Подборки — Frame';

    const content = this.create();
    loadData(content, getCollections(), (collections) => {
      const rows = collections.map((collection) => renderTemplate(rowTemplate, {
        ...collection,
        count: countLabel(collection.movies),
        cover: coverProps({ ...collection, poster: collection.movies[0]?.poster }),
      }));

      content.querySelector('.page-status').textContent = rows.length ? '' : 'Подборок пока нет.';
      content.querySelector('.collections__list').replaceChildren(...rows);
      watchCovers(content);
    });

    return createPageShell({ navigate: this.navigate, content });
  }
}
