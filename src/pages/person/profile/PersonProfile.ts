import './person-profile.css';
import templateSource from './PersonProfile.hbs';
import { Component } from '../../../core/component.js';
import { loadAssets } from '../../../core/assets.js';
import {
  personFacts,
  personRoles,
  sortPersonCredits,
  type PersonCredit,
} from '../../../services/person-profile.js';
import type { Person } from '../../../api/people.js';
import { countLabel } from '../../../core/format.js';
import { notify } from '../../../services/notice.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';
import { PersonFilmography } from '../filmography/PersonFilmography.js';

const template = await loadAssets({ template: templateSource });
const bell = new URL('../../../assets/icons/person-bell.svg', import.meta.url).href;
const heart = new URL('../../../assets/icons/film-heart.svg', import.meta.url).href;
const share = new URL('../../../assets/icons/person-share.svg', import.meta.url).href;
const back = new URL('../../../assets/icons/person-back.svg', import.meta.url).href;
const star = new URL('../../../assets/icons/person-star.svg', import.meta.url).href;

interface PersonProfileProps {
  person: Person;
  films: PersonCredit[];
  query?: URLSearchParams;
  partial?: boolean;
  onRetry?: () => void;
}

export class PersonProfile extends Component<PersonProfileProps> {
  static template = template;

  context() {
    const { person, films } = this.props;
    const groups = personRoles(films);
    const roles = groups.map((group) => group.label).join(' · ');
    const unique = [...new Map(films.map((credit) => [credit.film.id, credit.film])).values()];
    const known = new Map<number, PersonCredit>();
    sortPersonCredits(films)
      .filter((credit) => credit.character && ['actor', 'voice'].includes(credit.role))
      .forEach((credit) => {
        if (!known.has(credit.film.id)) known.set(credit.film.id, credit);
      });
    const cards = known.size
      ? [...known.values()].slice(0, 6)
      : sortPersonCredits(films)
          .filter(
            (credit, index, all) =>
              all.findIndex((item) => item.film.id === credit.film.id) === index,
          )
          .slice(0, 6);
    const facts = personFacts(person);
    const stats = [
      { term: 'В каталоге Frame', value: countLabel(unique.length, ['работа', 'работы', 'работ']) },
      { term: 'Фильмы', value: String(unique.filter((film) => !film.isSeries).length) },
      { term: 'Сериалы', value: String(unique.filter((film) => film.isSeries).length) },
      { term: 'Профессии', value: roles || 'Не указаны' },
    ];
    if (this.props.partial)
      stats.forEach((stat) => {
        stat.value = 'Не загружено';
      });
    return {
      person,
      partial: this.props.partial,
      roles,
      facts,
      stats,
      mobileFacts: [...facts, stats[0], stats[3]],
      cards,
      cardTitle: known.size ? 'Роли в каталоге' : 'Работы в каталоге',
      backdrop: cards.find((credit) => credit.film.poster)?.film.poster || '',
      subtitle: [person.originalName, roles.toLocaleLowerCase('ru')].filter(Boolean).join(' · '),
      bell,
      heart,
      share,
      back,
      star,
    };
  }

  onRender() {
    const context = this.context();
    this.insert(
      'filmography',
      new PersonFilmography({
        credits: this.props.films,
        query: this.props.query,
        unavailable: this.props.partial,
      }),
    );
    this.delegate('click', '[data-retry-person]', () => this.props.onRetry?.());
    if (context.cards.length)
      this.insert('roles-heading', new SectionHeading({ title: context.cardTitle }));
    this.delegate('click', '[data-share-person]', () => this.#share());
    const biography = this.find('.person-profile__biography-text');
    const toggle = this.find<HTMLButtonElement>('[data-biography-toggle]');
    const measure = () => {
      if (biography && toggle && toggle.getAttribute('aria-expanded') !== 'true')
        toggle.hidden = biography.scrollHeight <= biography.clientHeight + 1;
    };
    const frame = requestAnimationFrame(measure);
    this.watch(() => cancelAnimationFrame(frame));
    const resize = new ResizeObserver(measure);
    if (biography) resize.observe(biography);
    this.watch(() => resize.disconnect());
    this.delegate('click', '[data-biography-toggle]', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      biography.classList.toggle('person-profile__biography-text--expanded', expanded);
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? 'Свернуть' : 'Читать полностью';
    });
    const hero = this.find('.person-profile__hero');
    const root = this.element;
    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.scrolled = String(!entry.isIntersecting);
    });
    observer.observe(hero);
    this.watch(() => observer.disconnect());
  }

  async #share() {
    const url = new URL(`/person/${this.props.person.id}`, location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: this.props.person.name, url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Ссылка на страницу скопирована.', { type: 'success' });
      }
    } catch (error) {
      if (error.name !== 'AbortError') notify('Не удалось поделиться ссылкой.', { type: 'error' });
    }
  }
}
