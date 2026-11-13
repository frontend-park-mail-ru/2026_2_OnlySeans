import { ApiError, assetUrl, request } from './http.js';
import { getFilm, toFilm, type FilmResponse } from './films.js';
import { HttpStatus } from './errors.js';

export const ROLE_LABELS = {
  actor: 'Актёр',
  director: 'Режиссёр',
  writer: 'Сценарист',
  producer: 'Продюсер',
  creator: 'Создатель',
  voice: 'Озвучка',
};

interface PersonResponse {
  id: number;
  name: string;
  original_name?: string;
  photo_url?: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  biography?: string;
}

interface CreditResponse {
  role: string;
  character?: string;
}

const toPerson = (person: PersonResponse) => ({
  id: person.id,
  name: person.name,
  originalName: person.original_name || '',
  photo: assetUrl(person.photo_url),
  birthDate: person.birth_date || '',
  deathDate: person.death_date || '',
  birthPlace: person.birth_place || '',
  biography: person.biography || '',
});

const toCredit = (credit: CreditResponse) => ({
  role: credit.role,
  character: credit.character || '',
});

export async function getFilmPeople(filmId: number | string, { signal }: { signal?: AbortSignal } = {}) {
  try {
    const data = await request<{ people: (CreditResponse & { person: PersonResponse })[] }>(`/films/${encodeURIComponent(filmId)}/people`, { signal });
    return (data.people || []).map((item) => ({
      ...toCredit(item),
      person: toPerson(item.person),
    }));
  } catch (error) {
    if (error instanceof ApiError && error.status === HttpStatus.NOT_FOUND) return [];
    throw error;
  }
}

export async function getPerson(id: number | string, { signal }: { signal?: AbortSignal } = {}) {
  const data = await request<{ person: PersonResponse; films: (CreditResponse & { film: FilmResponse })[] }>(`/people/${encodeURIComponent(id)}`, { signal });
  const films = (data.films || []).map((item) => ({ ...toCredit(item), film: toFilm(item.film) }));
  const missing = [...new Set(films.filter((item) => !item.film.poster).map((item) => item.film.id))];
  const posters = new Map<number, string>();
  for (let index = 0; index < missing.length; index += 6) {
    const batch = missing.slice(index, index + 6);
    const resolved = await Promise.all(batch.map(async (filmId) => {
      try {
        return [filmId, (await getFilm(filmId, { signal })).poster] as const;
      } catch {
        return [filmId, ''] as const;
      }
    }));
    resolved.forEach(([filmId, poster]) => posters.set(filmId, poster));
  }
  return {
    person: toPerson(data.person),
    films: films.map((item) => ({
      ...item,
      film: { ...item.film, poster: item.film.poster || posters.get(item.film.id) || '' },
    })),
  };
}
