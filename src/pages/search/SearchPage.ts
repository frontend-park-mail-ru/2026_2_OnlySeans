import './search-page.css';
import templateSource from './SearchPage.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { loadCatalog } from '../../services/catalog.js';
import { getPeople } from '../../api/people.js';
import { clearSearchHistory, searchHistory } from '../../services/search-history.js';
import { SectionHeading } from '../../components/section-heading/SectionHeading.js';
import { SearchField } from '../../components/search-field/SearchField.js';
import { FilmFeed } from '../../components/film-feed/FilmFeed.js';
import { PersonCard } from '../../components/person-card/PersonCard.js';
import { StatusMessage } from '../../components/status-message/StatusMessage.js';
import { loadInto } from '../../components/status-message/load-into.js';

const template = await loadAssets({ template: templateSource });
const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');

/** Поиск по названиям фильмов и именам персон из действующих методов API. */
export class SearchPage extends Component {
  static template = template;

  context() {
    const query = (this.props.query.get('q') || '').trim();
    return { query, history: searchHistory() };
  }

  onRender() {
    const { query } = this.context();
    document.title = query ? `Поиск: ${query} | Frame` : 'Поиск | Frame';
    this.insert('heading', new SectionHeading({ title: 'Поиск', level: 1 }));
    this.insert('search', new SearchField({ navigate: this.props.navigate }));
    this.delegate('click', '[data-clear-history]', () => {
      clearSearchHistory();
      this.update();
    });
    if (!query) return;
    const needle = normalize(query);
    loadInto(this, 'films', {
      load: async () =>
        (await loadCatalog()).filter((film) =>
          normalize(`${film.title} ${film.originalTitle}`).includes(needle),
        ),
      render: (films) =>
        new FilmFeed({
          title: 'Фильмы и сериалы',
          films,
          query: this.props.query,
          empty: 'По этому запросу фильмы не найдены. Попробуйте другое название.',
        }),
    });
    const controller = new AbortController();
    this.watch(() => controller.abort());
    const peopleGrid = this.find('.search-page__people-grid');
    loadInto(this, peopleGrid, {
      load: async () =>
        (await getPeople({ signal: controller.signal })).filter((person) =>
          normalize(`${person.name} ${person.originalName}`).includes(needle),
        ),
      render: (people) => {
        people.forEach((person) => this.insert(peopleGrid, new PersonCard(person)));
        return people.length
          ? null
          : new StatusMessage({ text: 'По этому запросу люди не найдены.' });
      },
      failure: () => 'Не удалось загрузить людей.',
    });
  }
}
