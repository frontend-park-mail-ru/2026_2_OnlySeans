import { createMerchPanel } from './merch-panel.js';
import { createSequelStrip } from './sequel-strip.js';
import { enhanceFilmHero, createFilmProfile } from './film-profile.js';
import { createSpoilerContext } from '../../services/spoiler-context.js';
import { createCommentsPanel } from './comments-panel.js';
import { getFandom } from '../../api/fandom.js';
import { ThreadPage } from './thread-page.js';
import { getMovie } from '../../api/movies.js';
import { createCatalogPage } from '../discover/catalog-ui.js';
import { createMovieListButton } from '../../components/ui/movie-actions/movie-actions.js';
import { createPersonalLibraryButton } from '../../components/ui/movie-actions/personal-library.js';
import { getMoviePoster } from '../../services/posters.js';
import { NotFoundPage } from '../not-found/not-found.js';
import { createFandomPanel } from './fandom-panel.js';
import { element, skeletons, showRetry } from './film-ui.js';

export class FilmPage {
  constructor({ navigate, params }) { this.navigate = navigate;this.params = params; }
  render() {
    const { id, threadId } = this.params;
    const validID = value => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
    if (!validID(id) || (threadId && !validID(threadId))) return new NotFoundPage({ navigate: this.navigate }).render();
    if (threadId) return new ThreadPage({params:this.params,navigate:this.navigate}).render();
    const comments = location.pathname.endsWith('/comments');
    const merch = location.pathname.endsWith('/merch');
    const filmId = Number(id), fandom = location.pathname.endsWith('/discussion') || Boolean(threadId);
    document.title = 'Фильм — Frame';
    const { page, main } = createCatalogPage(this.navigate);main.className = 'film-page';
    const hero = element('section', 'film-hero');const tabs = element('nav', 'film-tabs');tabs.setAttribute('aria-label', 'Разделы фильма');
    for (const [label, href, active] of [['О фильме', `/film/${id}`, !fandom&&!comments&&!merch], ['Отзывы', `/film/${id}/comments`, comments], ['Обсуждение', `/film/${id}/discussion`, fandom], ['Аутфиты и мерч', `/film/${id}/merch`, merch]]) {
      const link = element('a', '', label);link.href = href;link.dataset.link = '';if(label==='Отзывы'||label==='Обсуждение'){const badge=element('span','discussion-tab-count','—');if(label==='Обсуждение')badge.dataset.discussionCount='';else badge.dataset.commentsCount='';badge.setAttribute('aria-label','Темы загружаются');link.append(badge);}if (active) link.setAttribute('aria-current', 'page');tabs.append(link);
    }
    const content = element('div', 'film-content');main.append(hero, tabs, content);tabs.hidden = true;skeletons(hero, 1);
    const controller = new AbortController();
    const refreshSummary = async data => {
      try { const summary = data || await getFandom(filmId, {signal:controller.signal});if(!page.isConnected)return;
        for(const [selector,count,name]of [['[data-discussion-count]',summary.threads_count,'Тем'],['[data-comments-count]',summary.comments_count,'Отзывов и ответов']]){const badge=tabs.querySelector(selector);badge.textContent=String(count);badge.setAttribute('aria-label',`${name}: ${count}`);}
      }catch(error){if(error.name!=='AbortError'&&page.isConnected){for(const badge of tabs.querySelectorAll('.discussion-tab-count'))badge.setAttribute('aria-label','Счётчик временно недоступен');}}
    };
    const load = async () => {
      skeletons(hero, 1);
      try {
        const movie = await getMovie(filmId, { signal: controller.signal });if (!page.isConnected) return;
        const spoilers = fandom||comments?createSpoilerContext():null;if(!page.isConnected)return;
        document.title = `${movie.title}${fandom ? ' · Обсуждение' : comments ? ' · Отзывы' : merch ? ' · Аутфиты и мерч' : ''} — Frame`;
        hero.replaceChildren();hero.removeAttribute('aria-busy');hero.removeAttribute('aria-label');
        const poster = element('div', 'film-hero__poster');const image = element('img');image.src = getMoviePoster(movie);image.alt = `Постер: ${movie.title}`;image.width = 96;image.height = 144;
        image.addEventListener('error', () => { image.hidden = true;poster.append(element('span', 'film-poster-fallback', 'Постер недоступен')); }, { once: true });poster.append(image);
        const info = element('div', 'film-hero__info');const catalog=element('a','film-catalog-link','← Каталог');catalog.href='/films';catalog.dataset.link='';info.append(catalog, element('h1', '', movie.title));
        if (movie.englishTitle) { const original = element('p', 'film-hero__original', movie.englishTitle);original.lang = 'en';info.append(original); }
        const meta = element('div', 'film-hero__meta');
        for (const value of [movie.year, movie.type === 'series' ? 'Сериал' : 'Фильм', movie.durationMinutes > 0 ? `${movie.durationMinutes} мин${movie.type === 'series' ? '/серия' : ''}` : '', movie.rating !== null ? `★ ${movie.rating.toFixed(1)}` : '']) { if (value) meta.append(element('span', '', String(value))); }
        const actions = element('div', 'film-hero__actions');actions.setAttribute('role', 'group');actions.setAttribute('aria-label', 'Действия с фильмом');actions.append(createMovieListButton(movie, page, 'favorite'), createMovieListButton(movie, page, 'watchlater'));const personal = createPersonalLibraryButton(movie, page);if (personal) actions.append(personal);
        info.append(meta, actions);const sequel = createSequelStrip({ movie, page, signal: controller.signal });if (sequel) meta.after(sequel);hero.append(poster, info);tabs.hidden = false;
        if (!fandom && !comments && !merch) { main.classList.add('film-page--profile');enhanceFilmHero(hero, movie); }
        void refreshSummary();
        if (fandom) content.replaceChildren(createFandomPanel({ filmId, page, navigate: this.navigate, refreshSummary, spoilers }));
        else if(merch) content.replaceChildren(createMerchPanel(movie));
        else if(comments) content.replaceChildren(createCommentsPanel({filmId,page,navigate:this.navigate,refreshSummary,spoilers}));
        else {
          const profile = await createFilmProfile({movie, page, signal:controller.signal, hero});
          if (profile && !controller.signal.aborted && page.isConnected) content.replaceChildren(profile);
        }
      } catch (error) {
        if (controller.signal.aborted || !page.isConnected) return;
        if (error.status === 404) { page.replaceWith(new NotFoundPage({ navigate: this.navigate }).render());return; }
        showRetry(hero, 'Не удалось загрузить фильм. Проверьте соединение.', load);
      }
    };
    requestAnimationFrame(() => {
      if (!page.isConnected) return;
      const observer = new MutationObserver(() => { if (!page.isConnected) { controller.abort();observer.disconnect(); } });observer.observe(page.parentElement, { childList: true });
    });
    void load();return page;
  }
}
