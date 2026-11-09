import './person-profile.css';
import templateSource from './PersonProfile.hbs';
import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { ROLE_LABELS } from '../../../api/people.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';
import { MovieGrid } from '../../../components/movie-grid/MovieGrid.js';
import { StatusMessage } from '../../../components/status-message/StatusMessage.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const ROLE_ORDER = ['actor', 'voice', 'director', 'creator', 'writer', 'producer'];

const parseDate = (value) => {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date : null;
};

const formatDate = (date) =>
  date
    .toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(/\s*г\.$/, '');

function yearsBetween(from, to) {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  const beforeBirthday =
    to.getUTCMonth() < from.getUTCMonth() ||
    (to.getUTCMonth() === from.getUTCMonth() && to.getUTCDate() < from.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

function lifeFacts({ birthDate, deathDate, birthPlace }) {
  const birth = parseDate(birthDate);
  const death = parseDate(deathDate);
  const age = (from, to) => countLabel(yearsBetween(from, to), ['год', 'года', 'лет']);
  const facts = [];
  if (birth && death) {
    facts.push({ term: 'Дата рождения', value: formatDate(birth) });
    facts.push({ term: 'Дата смерти', value: `${formatDate(death)} (${age(birth, death)})` });
  } else if (birth) {
    facts.push({
      term: 'Дата рождения',
      value: `${formatDate(birth)} (${age(birth, new Date())})`,
    });
  }
  if (birthPlace) facts.push({ term: 'Место рождения', value: birthPlace });
  return facts;
}

function groupByRole(films) {
  const groups = new Map();
  films.forEach(({ role, film }) => {
    if (!groups.has(role)) groups.set(role, []);
    if (!groups.get(role).some((item) => item.id === film.id)) groups.get(role).push(film);
  });
  return [...groups.entries()].sort(([a], [b]) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
}

export class PersonProfile extends Component {
  static template = template;

  context() {
    const { person, films } = this.props;
    const roles = groupByRole(films)
      .map(([role]) => ROLE_LABELS[role])
      .filter(Boolean)
      .join(' · ');
    return { person, roles, facts: lifeFacts(person) };
  }

  onRender() {
    const works = this.find('.person-profile__works');
    const groups = groupByRole(this.props.films);
    if (!groups.length) {
      this.insert(works, new StatusMessage({ text: 'Фильмов в каталоге пока нет.' }));
      return;
    }
    groups.forEach(([role, films]) => {
      const section = document.createElement('section');
      section.className = 'person-profile__section';
      works.append(section);
      this.insert(
        section,
        new SectionHeading({
          title: ROLE_LABELS[role] || role,
          count: countLabel(films.length, ['фильм', 'фильма', 'фильмов']),
        }),
      );
      this.insert(section, new MovieGrid({ films, view: 'grid' }));
    });
  }
}
