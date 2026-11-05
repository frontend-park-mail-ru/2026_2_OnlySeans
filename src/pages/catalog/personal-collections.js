import { store } from '../../modules/store.js';
import { getMovies } from '../../api/movies.js';
import {
  readPersonalLibrary,
  loadPersonalLibrary,
  createPersonalCollection,
  renamePersonalCollection,
} from '../../services/personal-library.js';
import {
  createCatalogPage,
  sectionHeading,
  createStatus,
  showLoadError,
  createMovieTile,
  createPosterStack,
  filmCount,
} from '../discover/catalog-ui.js';
import { createCatalogViewToggle } from '../../components/ui/catalog-view/catalog-view.js';
import { notifyPersonalLibrary } from '../../components/ui/movie-actions/personal-library.js';
import { createCollectionSettings } from './collection-settings.js';
import { limitTextInput } from '../../utils/text-limit.js';
import { element } from '../../utils/dom.js';

const makeForm = (label, buttonLabel, initial = '') => {
  const form = element('form', 'personal-collection-form');
  const field = element('label', '', label);
  const input = element('input');
  input.name = 'collection-name';
  limitTextInput(input, 80);
  input.required = true;
  input.autocomplete = 'off';
  input.value = initial;
  input.placeholder = 'Например, пересмотреть зимой';
  field.append(input);
  const button = element('button');
  button.type = 'submit';
  button.textContent = buttonLabel;
  form.append(field, button);
  return form;
};

export class PersonalCollectionsPage {
  constructor({ navigate }) {
    this.navigate = navigate;
  }
  render() {
    document.title = 'Мои коллекции — Frame';
    const id = new URLSearchParams(location.search).get('id');
    const { page, main } = createCatalogPage(this.navigate);
    main.className = 'library-page personal-collections-page';
    const heading = sectionHeading('Мои коллекции', { level: 1, count: '' });
    const status = createStatus('Загружаем ваши коллекции…');
    main.append(heading, status);
    if (!store.get('user')) {
      status.textContent = 'Войдите, чтобы создавать свои коллекции фильмов.';
      const login = element('a');
      login.href = '/login';
      login.dataset.link = '';
      login.className = 'library-empty-link';
      login.textContent = 'Войти →';
      main.append(login);
      return page;
    }
    const intro = element(
      'p',
      'collections-page__intro',
      'Ваши темы, любимые истории и планы пересмотреть.',
    );
    heading.after(intro);
    const management = element('div', 'personal-collection-management');
    const content = element('div');
    main.append(management, content);
    let movies = [];
    let ready = false;
    let busy = false;
    const run = async (task) => {
      if (busy) return false;
      busy = true;
      status.textContent = '';
      management.querySelectorAll('button,input').forEach((input) => {
        input.disabled = true;
      });
      try {
        await task();
        if (page.isConnected) {
          notifyPersonalLibrary(page);
          render();
        }
        return true;
      } catch (error) {
        if (page.isConnected)
          status.textContent = error.message || 'Не удалось сохранить изменения.';
        return false;
      } finally {
        busy = false;
        management.querySelectorAll('button,input').forEach((input) => {
          input.disabled = false;
        });
      }
    };
    const render = () => {
      if (!ready) return;
      const data = readPersonalLibrary();
      const byId = new Map(movies.map((movie) => [movie.id, movie]));
      status.textContent = '';
      management.replaceChildren();
      content.replaceChildren();
      heading.querySelector('h1').lastChild.textContent = id
        ? data.collections.find((item) => item.id === id)?.name || 'Коллекция не найдена'
        : 'Мои коллекции';
      if (id) {
        const item = data.collections.find((item) => item.id === id);
        const back = element('a');
        back.href = '/my-collections';
        back.dataset.link = '';
        back.className = 'library-empty-link';
        back.textContent = '← Все мои коллекции';
        management.append(back);
        if (!item) {
          heading.querySelector('.catalog-count').textContent = '';
          status.textContent = 'Эта коллекция удалена или недоступна.';
          return;
        }
        document.title = `${item.name} — Frame`;
        const selected = item.filmIds.map((filmId) => byId.get(filmId)).filter(Boolean);
        heading.querySelector('.catalog-count').textContent = filmCount(selected.length);
        const controls = element('div', 'personal-collection-controls');
        const rename = element('button');
        rename.type = 'button';
        rename.className = 'collection-rename-button';
        rename.setAttribute('aria-label', 'Поменять название');
        rename.title = 'Поменять название';
        rename.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 4 5 5M4 15 15 4a3.5 3.5 0 0 1 5 5L9 20l-6 1Z"/></svg>';
        controls.append(
          rename,
          ...createCollectionSettings(
            item,
            page,
            () => {
              if (!readPersonalLibrary().collections.some((collection) => collection.id === id))
                this.navigate('/my-collections');
              else notifyPersonalLibrary(page);
            },
            { gear: true },
          ),
        );
        management.append(controls);
        rename.addEventListener('click', () => {
          if (management.querySelector('.personal-collection-form')) {
            management.querySelector('.personal-collection-form input').focus();
            return;
          }
          rename.hidden = true;
          const form = makeForm('Новое название', 'Сохранить', item.name);
          const cancel = element('button');
          cancel.type = 'button';
          cancel.textContent = 'Отмена';
          cancel.addEventListener('click', () => {
            form.remove();
            rename.hidden = false;
            rename.focus();
          });
          form.append(cancel);
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (await run(() => renamePersonalCollection(id, form.querySelector('input').value)))
              management.querySelector('.collection-rename-button')?.focus();
          });
          management.append(form);
          form.querySelector('input').focus();
        });
        const oldToggle = heading.querySelector('.catalog-view-toggle');
        oldToggle?.remove();
        const grid = element('div', 'movie-grid');
        heading.append(createCatalogViewToggle(grid));
        grid.append(...selected.map((movie) => createMovieTile(movie, page)));
        content.append(grid);
        intro.textContent = 'Один фильм может быть в нескольких ваших коллекциях.';
        if (!selected.length) {
          const empty = createStatus(
            'В этой коллекции пока нет фильмов. Добавляйте их через кнопку «Моё кино» на карточках.',
          );
          content.append(empty);
        }
      } else {
        heading.querySelector('.catalog-count').textContent = String(data.collections.length);
        content.className = 'collection-grid personal-collection-grid';
        const form = makeForm('Название новой коллекции', 'Создать коллекцию');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          await run(() => createPersonalCollection(form.querySelector('input').value));
        });
        management.append(form);
        if (!data.collections.length) {
          status.textContent =
            'Создайте первую коллекцию: например, «Пересмотреть» или «Посоветовать друзьям».';
        }
        for (const item of data.collections) {
          const card = element('article', 'personal-collection-card');
          const link = element('a', 'collection-card');
          link.href = `/my-collections?id=${item.id}`;
          link.dataset.link = '';
          const text = element('div', 'collection-card__text');
          const count = element('span', 'collection-card__count', filmCount(item.filmIds.length));
          const title = element('h3', '', item.name);
          text.append(count, title);
          link.append(text);
          const selected = item.filmIds.map((id) => byId.get(id)).filter(Boolean);
          if (selected.length) link.append(createPosterStack(selected));
          else {
            const symbol = element('span', 'personal-collection-empty');
            symbol.setAttribute('aria-hidden', 'true');
            symbol.textContent = '+';
            link.append(symbol);
          }
          card.append(
            link,
            ...createCollectionSettings(item, page, () => notifyPersonalLibrary(page)),
          );
          content.append(card);
        }
      }
    };
    page.addEventListener('personallibrarychange', () => {
      if (page.isConnected) render();
    });
    const load = async () => {
      status.textContent = 'Загружаем ваши коллекции…';
      try {
        const [, catalog] = await Promise.all([loadPersonalLibrary(), getMovies()]);
        if (!page.isConnected) return;
        movies = catalog;
        ready = true;
        render();
      } catch (error) {
        if (page.isConnected) showLoadError(status, load, error.message);
      }
    };
    void load();
    return page;
  }
}
