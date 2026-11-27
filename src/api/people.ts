import { ApiError, assetUrl, request, requestPages } from './http.js';
import { getFilm, toFilm, type FilmResponse } from './films.js';
import { HttpStatus } from './errors.js';

export const ROLE_LABELS: Record<string, string> = {
  actor: 'Актёр',
  director: 'Режиссёр',
  writer: 'Сценарист',
  producer: 'Продюсер',
  creator: 'Создатель',
  voice: 'Озвучка',
};

interface PersonResponse {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
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
  name:
    person.name ||
    [person.first_name, person.last_name].filter(Boolean).join(' ') ||
    'Имя не указано',
  originalName: person.original_name || '',
  photo: assetUrl(person.photo_url),
  birthDate: person.birth_date || '',
  deathDate: person.death_date || '',
  birthPlace: person.birth_place || '',
  biography: person.biography || '',
});
export type Person = ReturnType<typeof toPerson>;

/** Возвращает доступных персон каталога для поиска по имени. */
export async function getPeople({ signal }: { signal?: AbortSignal } = {}) {
  const pages = await requestPages<{ persons: PersonResponse[]; total: number }>('/persons', {
    signal,
    count: (data) => data.persons.length,
  });
  return pages.flatMap((page) => page.persons.map(toPerson));
}

const toCredit = (credit: CreditResponse) => ({
  role: credit.role,
  character: credit.character || '',
});

export async function getFilmPeople(
  filmId: number | string,
  { signal }: { signal?: AbortSignal } = {},
) {
  try {
    const data = await request<{ people: (CreditResponse & { person: PersonResponse })[] }>(
      `/films/${encodeURIComponent(filmId)}/people`,
      { signal },
    );
    return (data.people || []).map((item) => ({
      ...toCredit(item),
      person: toPerson(item.person),
    }));
  } catch (error) {
    if (error instanceof ApiError && error.status === HttpStatus.NOT_FOUND) return [];
    throw error;
  }
}

/** При сбое расширенной карточки сохраняет основные данные из публичного API персон. */
export async function getPerson(id: number | string, { signal }: { signal?: AbortSignal } = {}) {
  type PersonCatalog = {
    person: PersonResponse;
    films: (CreditResponse & { film: FilmResponse })[];
  };
  let data: PersonCatalog;
  let partial = false;
  try {
    data = await request<PersonCatalog>(`/people/${encodeURIComponent(id)}`, { signal });
  } catch (error) {
    if (
      signal?.aborted ||
      !(error instanceof TypeError || (error instanceof ApiError && error.status >= 500))
    )
      throw error;
    try {
      const basic = await request<{ person: PersonResponse }>(
        `/persons/${encodeURIComponent(id)}`,
        { signal },
      );
      data = { person: basic.person, films: [] };
      partial = true;
    } catch (fallbackError) {
      if (
        signal?.aborted ||
        (fallbackError instanceof ApiError && fallbackError.status === HttpStatus.NOT_FOUND)
      )
        throw fallbackError;
      throw error;
    }
  }
  const films = (data.films || []).map((item) => ({ ...toCredit(item), film: toFilm(item.film) }));
  const missing = [
    ...new Set(films.filter((item) => !item.film.poster).map((item) => item.film.id)),
  ];
  const posters = new Map<number, string>();
  for (let index = 0; index < missing.length; index += 6) {
    const batch = missing.slice(index, index + 6);
    const resolved = await Promise.all(
      batch.map(async (filmId) => {
        try {
          return [filmId, (await getFilm(filmId, { signal })).poster] as const;
        } catch (error) {
          if (signal?.aborted) throw error;
          return [filmId, ''] as const;
        }
      }),
    );
    resolved.forEach(([filmId, poster]) => posters.set(filmId, poster));
  }
  return {
    partial,
    person: toPerson(data.person),
    films: films.map((item) => ({
      ...item,
      film: { ...item.film, poster: item.film.poster || posters.get(item.film.id) || '' },
    })),
  };
}
