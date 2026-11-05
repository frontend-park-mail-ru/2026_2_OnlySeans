import { getCollections, getCollection } from '../../api/collections.js';
import {
  createCatalogPage,
  sectionHeading,
  createStatus,
  showLoadError,
  createCollectionCard,
  createPosterStack,
  createMovieTile,
  filmCount,
} from '../discover/catalog-ui.js';
import { createCatalogViewToggle } from '../../components/ui/catalog-view/catalog-view.js';
import { getMovies } from '../../api/movies.js';
import { readSharedCollection } from '../../services/collection-sharing.js';
import { element } from '../../utils/dom.js';

// подборка из ссылки «поделиться» собирается из адреса, обычная приходит с сервера
const loadCollection = async (id, shared) => {
  if (shared) {
    const snapshot = readSharedCollection(location.hash);
    const catalog = await getMovies();
    const byId = new Map(catalog.map((movie) => [movie.id, movie]));
    return {
      title: snapshot.name,
      description: 'С вами поделились коллекцией. Это копия на момент отправки ссылки.',
      films: snapshot.filmIds.map((filmId) => byId.get(filmId)).filter(Boolean),
    };
  }
  if (!/^\d+$/.test(id) || Number(id) <= 0) throw new Error('Подборка не найдена.');
  return getCollection(id);
};

export class CollectionsPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }
  render() {
    document.title = 'Подборки — Frame';
    const { page, main } = createCatalogPage(this.navigate);
    main.className = 'collections-page';
    const id = new URLSearchParams(location.search).get('id');
    const shared = new URLSearchParams(location.hash.slice(1)).has('shared');
    const status = createStatus(id ? 'Загружаем подборку…' : 'Загружаем подборки…');
    if (!id && !shared) {
      main.append(sectionHeading('Подборки', { level: 1 }));
      const subtitle = element(
        'p',
        'collections-page__intro',
        'Подборки редакции — от драм до сериалов на выходные.',
      );
      main.append(subtitle);
    }
    main.append(status);
    const content = element('div');
    main.append(content);
    const load = async () => {
      // ошибку проверки показываем, когда страница уже на экране
      await Promise.resolve();
      if (!page.isConnected) return;
      content.replaceChildren();
      status.textContent = 'Загружаем подборки…';
      try {
        if (id || shared) {
          const collection = await loadCollection(id, shared);
          if (!page.isConnected) return;
          document.title = `${collection.title} — Frame`;
          const hero = element('section', 'collection-hero');
          const text = element('div');
          const eyebrow = element(
            'p',
            'featured-movie__eyebrow',
            `Подборки / ${filmCount(collection.films.length)}`,
          );
          const title = element('h1', '', collection.title);
          const description = element('p', '', collection.description || '');
          const back = element('a');
          back.href = '/collections';
          back.dataset.link = '';
          back.className = 'button button--secondary';
          back.textContent = '← Все подборки';
          text.append(eyebrow, title, description, back);
          hero.append(text, createPosterStack(collection.films));
          const heading = sectionHeading('Фильмы подборки', {
            count: filmCount(collection.films.length),
          });
          const grid = element('div', 'movie-grid');
          heading.append(createCatalogViewToggle(grid));
          grid.replaceChildren(...collection.films.map((movie) => createMovieTile(movie, page)));
          content.append(hero, heading, grid);
          status.textContent = collection.films.length ? '' : 'В этой подборке пока нет фильмов.';
        } else {
          const collections = await getCollections();
          if (!page.isConnected) return;
          content.className = 'collection-grid';
          content.replaceChildren(...collections.map(createCollectionCard));
          status.textContent = collections.length ? '' : 'Подборок пока нет.';
        }
      } catch (error) {
        if (page.isConnected) showLoadError(status, load, error.message);
      }
    };
    void load();
    return page;
  }
}
