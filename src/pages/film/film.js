import { createMerchPanel } from './merch-panel.js';
import { createSequelStrip } from './sequel-strip.js';
import { enhanceFilmHero, createFilmProfile } from './film-profile.js';
import { getMovie } from '../../api/movies.js';
import { createCatalogPage } from '../discover/catalog-ui.js';
import { createMovieListButton } from '../../components/ui/movie-actions/movie-actions.js';
import { createPersonalLibraryButton } from '../../components/ui/movie-actions/personal-library.js';
import { getMoviePoster } from '../../services/posters.js';
import { NotFoundPage } from '../not-found/not-found.js';
import { skeletons, showRetry } from './film-ui.js';
import { element } from '../../utils/dom.js';

export class FilmPage {
  constructor({ navigate, params }) {
    this.navigate = navigate;
    this.params = params;
  }
  render() {
    const { id } = this.params;
    const validID = (value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
    if (!validID(id)) return new NotFoundPage({ navigate: this.navigate }).render();
    const merch = location.pathname.endsWith('/merch');
    const filmId = Number(id);
    document.title = 'Фильм — Frame';
    const { page, main } = createCatalogPage(this.navigate);
    main.className = 'film-page';
    const hero = element('section', 'film-hero');
    const tabs = element('nav', 'film-tabs');
    tabs.setAttribute('aria-label', 'Разделы фильма');
    for (const [label, href, active] of [
      ['О фильме', `/film/${id}`, !merch],
      ['Аутфиты и мерч', `/film/${id}/merch`, merch],
    ]) {
      const link = element('a', '', label);
      link.href = href;
      link.dataset.link = '';
      if (active) link.setAttribute('aria-current', 'page');
      tabs.append(link);
    }
    const content = element('div', 'film-content');
    main.append(hero, tabs, content);
    tabs.hidden = true;
    skeletons(hero, 1);
    const controller = new AbortController();
    const load = async () => {
      skeletons(hero, 1);
      try {
        const movie = await getMovie(filmId, { signal: controller.signal });
        if (!page.isConnected) return;
        let section = '';
        if (merch) section = ' · Аутфиты и мерч';
        document.title = `${movie.title}${section} — Frame`;
        hero.replaceChildren();
        hero.removeAttribute('aria-busy');
        hero.removeAttribute('aria-label');
        const poster = element('div', 'film-hero__poster');
        const image = element('img');
        image.src = getMoviePoster(movie);
        image.alt = `Постер: ${movie.title}`;
        image.width = 96;
        image.height = 144;
        image.addEventListener(
          'error',
          () => {
            image.hidden = true;
            poster.append(element('span', 'film-poster-fallback', 'Постер недоступен'));
          },
          { once: true },
        );
        poster.append(image);
        const info = element('div', 'film-hero__info');
        const catalog = element('a', 'film-catalog-link', '← Каталог');
        catalog.href = '/films';
        catalog.dataset.link = '';
        info.append(catalog, element('h1', '', movie.title));
        if (movie.englishTitle) {
          const original = element('p', 'film-hero__original', movie.englishTitle);
          original.lang = 'en';
          info.append(original);
        }
        const meta = element('div', 'film-hero__meta');
        for (const value of [
          movie.year,
          movie.type === 'series' ? 'Сериал' : 'Фильм',
          movie.durationMinutes > 0
            ? `${movie.durationMinutes} мин${movie.type === 'series' ? '/серия' : ''}`
            : '',
          movie.rating !== null ? `★ ${movie.rating.toFixed(1)}` : '',
        ]) {
          if (value) meta.append(element('span', '', String(value)));
        }
        const actions = element('div', 'film-hero__actions');
        actions.setAttribute('role', 'group');
        actions.setAttribute('aria-label', 'Действия с фильмом');
        actions.append(
          createMovieListButton(movie, page, 'favorite'),
          createMovieListButton(movie, page, 'watchlater'),
        );
        const personal = createPersonalLibraryButton(movie, page);
        if (personal) actions.append(personal);
        info.append(meta, actions);
        const sequel = createSequelStrip({ movie, page, signal: controller.signal });
        if (sequel) meta.after(sequel);
        hero.append(poster, info);
        tabs.hidden = false;
        if (!merch) {
          main.classList.add('film-page--profile');
          enhanceFilmHero(hero, movie);
        }
        // «О фильме» собирается асинхронно, мерч — сразу
        if (merch) {
          content.replaceChildren(createMerchPanel(movie));
        } else {
          const profile = await createFilmProfile({ movie, page, signal: controller.signal, hero });
          if (profile && !controller.signal.aborted && page.isConnected)
            content.replaceChildren(profile);
        }
      } catch (error) {
        if (controller.signal.aborted || !page.isConnected) return;
        if (error.status === 404) {
          page.replaceWith(new NotFoundPage({ navigate: this.navigate }).render());
          return;
        }
        showRetry(hero, 'Не удалось загрузить фильм. Проверьте соединение.', load);
      }
    };
    requestAnimationFrame(() => {
      if (!page.isConnected) return;
      const observer = new MutationObserver(() => {
        if (!page.isConnected) {
          controller.abort();
          observer.disconnect();
        }
      });
      observer.observe(page.parentElement, { childList: true });
    });
    void load();
    return page;
  }
}
