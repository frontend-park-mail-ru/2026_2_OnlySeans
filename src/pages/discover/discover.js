import { renderTemplate } from '../../components/ui/render-template.js';
import { createSiteHeader } from '../../components/ui/site-header/site-header.js';
import { createMovieCard } from '../../components/ui/movie-card/movie-card.js';
import { getMovies } from '../../api/movies.js';

const template = window.Handlebars.compile(`
  <div class="discover-page">
    <main class="movie-feed" aria-labelledby="discover-title">
      <div class="movie-feed__heading"><h1 id="discover-title">Лента фильмов и сериалов</h1><p class="movie-feed__count"></p></div>
      <nav class="pagination" data-position="top" aria-label="Страницы ленты в начале" hidden></nav>
      <div class="movie-feed__list"></div>
      <p class="movie-feed__status" role="status">Загружаем каталог…</p>
      <nav class="pagination" data-position="bottom" aria-label="Страницы ленты в конце" hidden></nav>
    </main>
  </div>
`);
const PAGE_SIZE = 10;

export class DiscoverPage {
  constructor({ navigate }) {
    this.navigate = navigate;
    const requested = Number(new URLSearchParams(window.location.search).get('page'));
    this.currentPage = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  }
  render() {
    document.title = 'Лента — Frame';
    this.page = renderTemplate(template, {});
    this.page.prepend(createSiteHeader({ navigate: this.navigate }));
    getMovies().then((movies) => {
      if (!this.page.isConnected) return;
      const totalPages = Math.max(1, Math.ceil(movies.length / PAGE_SIZE));
      this.currentPage = Math.min(this.currentPage, totalPages);
      const start = (this.currentPage - 1) * PAGE_SIZE;
      const visible = movies.slice(start, start + PAGE_SIZE);
      this.page.querySelector('.movie-feed__list').replaceChildren(...visible.map(createMovieCard));
      this.page.querySelector('.movie-feed__count').textContent = movies.length ? `${start + 1}–${start + visible.length} из ${movies.length}` : '';
      this.page.querySelector('.movie-feed__status').textContent = movies.length ? '' : 'Каталог пока пуст.';
      this.page.querySelectorAll('.pagination').forEach((nav) => this.renderPagination(nav, totalPages));
      document.title = `Лента · Страница ${this.currentPage} — Frame`;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }).catch(() => {
      if (this.page.isConnected) this.page.querySelector('.movie-feed__status').textContent = 'Не удалось загрузить каталог. Обновите страницу.';
    });
    return this.page;
  }
  renderPagination(nav, totalPages) {
    nav.hidden = totalPages <= 1;
    if (nav.hidden) return;
    const createItem = (text, page, disabled = false) => {
      const current = page === this.currentPage && /^\d+$/.test(text);
      const item = document.createElement(disabled || current ? 'span' : 'a');
      item.className = 'pagination__item';
      item.textContent = text;
      if (current) item.setAttribute('aria-current', 'page');
      else if (disabled) item.setAttribute('aria-disabled', 'true');
      else {
        item.href = '/discover?page=' + page;
        item.setAttribute('data-link', '');
        item.setAttribute('aria-label', /^\d+$/.test(text) ? 'Страница ' + page : text);
      }
      return item;
    };
    const items = [createItem('← Назад', this.currentPage - 1, this.currentPage === 1)];
    for (let page = 1; page <= totalPages; page++) items.push(createItem(String(page), page));
    items.push(createItem('Вперёд →', this.currentPage + 1, this.currentPage === totalPages));
    nav.replaceChildren(...items);
  }
}
