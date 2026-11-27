import type { Film } from '../api/films.js';
import { ROLE_LABELS, type Person } from '../api/people.js';
import { countLabel } from '../core/format.js';

export interface PersonCredit {
  role: string;
  character: string;
  film: Film;
}

const ROLE_ORDER = ['actor', 'voice', 'director', 'creator', 'writer', 'producer'];

/** Объединяет повторные роли в одном фильме, сохраняя имена персонажей. */
export function personRoles(credits: PersonCredit[]) {
  const groups = new Map<string, Map<number, PersonCredit>>();
  for (const credit of credits) {
    const films = groups.get(credit.role) || new Map<number, PersonCredit>();
    const previous = films.get(credit.film.id);
    const characters = new Set(
      [...(previous?.character.split(' / ') || []), ...credit.character.split(' / ')].filter(
        Boolean,
      ),
    );
    films.set(credit.film.id, { ...credit, character: [...characters].join(' / ') });
    groups.set(credit.role, films);
  }
  const order = (role: string) =>
    ROLE_ORDER.includes(role) ? ROLE_ORDER.indexOf(role) : ROLE_ORDER.length;
  return [...groups]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([role, films]) => ({
      role,
      label: ROLE_LABELS[role] || 'Участие',
      credits: [...films.values()],
      count: films.size,
    }));
}

export function sortPersonCredits(credits: PersonCredit[], sort = 'newest') {
  return [...credits].sort((a, b) => {
    if (sort === 'title') return a.film.title.localeCompare(b.film.title, 'ru');
    const first = Number.isInteger(a.film.year) && a.film.year > 0 ? a.film.year : null;
    const second = Number.isInteger(b.film.year) && b.film.year > 0 ? b.film.year : null;
    if (first === null && second !== null) return 1;
    if (second === null && first !== null) return -1;
    return (
      ((first || 0) - (second || 0)) * (sort === 'oldest' ? 1 : -1) ||
      a.film.title.localeCompare(b.film.title, 'ru')
    );
  });
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10))
    return null;
  return date;
}

const formatDate = (date: Date) =>
  date
    .toLocaleDateString('ru', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replace(/\s*г\.$/, '');

/** Рассчитывает возраст на дату смерти либо на текущий день без сдвига часового пояса. */
export function personFacts(person: Person, now = new Date()) {
  const birth = parseDate(person.birthDate);
  const parsedDeath = parseDate(person.deathDate);
  const death =
    parsedDeath && birth && parsedDeath >= birth && parsedDeath <= now ? parsedDeath : null;
  const end = death || now;
  const facts: { term: string; value: string }[] = [];
  if (birth && birth <= now) {
    let years = end.getUTCFullYear() - birth.getUTCFullYear();
    if (
      end.getUTCMonth() < birth.getUTCMonth() ||
      (end.getUTCMonth() === birth.getUTCMonth() && end.getUTCDate() < birth.getUTCDate())
    )
      years--;
    facts.push({
      term: 'Дата рождения',
      value: `${formatDate(birth)}${!death && years >= 0 ? ` · ${countLabel(years, ['год', 'года', 'лет'])}` : ''}`,
    });
    if (death && death >= birth && death <= now)
      facts.push({
        term: 'Дата смерти',
        value: `${formatDate(death)} · ${countLabel(years, ['год', 'года', 'лет'])}`,
      });
  }
  if (person.birthPlace) facts.push({ term: 'Место рождения', value: person.birthPlace });
  return facts;
}
