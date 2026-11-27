import type { Film } from '../api/films.js';
import type { FilmInput } from '../api/admin.js';

export interface FilmFields {
  title: string;
  original_title: string;
  film_type: string;
  release_year: string;
  duration_min: string;
  age_limit: string;
  description: string;
}

/** Ограничения соответствуют services/catalog/internal/domain/film.go. */
export function validateFilm(fields: FilmFields): Partial<Record<keyof FilmFields, string>> {
  const errors: Partial<Record<keyof FilmFields, string>> = {};
  const length = (value: string) => [...value.trim()].length;
  if (!length(fields.title) || length(fields.title) > 255)
    errors.title = 'Введите название от 1 до 255 символов.';
  if (length(fields.original_title) > 255) errors.original_title = 'Не более 255 символов.';
  if (!['movie', 'series'].includes(fields.film_type)) errors.film_type = 'Выберите тип.';
  if (
    !/^\d{4}$/.test(fields.release_year) ||
    +fields.release_year < 1888 ||
    +fields.release_year > 2200
  )
    errors.release_year = 'Введите год от 1888 до 2200.';
  if (
    fields.film_type !== 'series' &&
    fields.duration_min &&
    (!/^\d+$/.test(fields.duration_min) || +fields.duration_min < 1 || +fields.duration_min > 6000)
  )
    errors.duration_min = 'Введите целое число от 1 до 6000.';
  if (!['0', '6', '12', '16', '18'].includes(fields.age_limit))
    errors.age_limit = 'Выберите возраст.';
  if ([...fields.description].length > 10000) errors.description = 'Не более 10 000 символов.';
  return errors;
}

export function filmInput(fields: FilmFields): FilmInput {
  return {
    title: fields.title.trim(),
    original_title: fields.original_title.trim() || null,
    film_type: fields.film_type as FilmInput['film_type'],
    release_year: +fields.release_year,
    duration_min:
      fields.film_type === 'series' || !fields.duration_min ? null : +fields.duration_min,
    age_limit: +fields.age_limit,
    description: fields.description.trim() || null,
  };
}

export function filmFields(film?: Film): FilmFields {
  return {
    title: film?.title || '',
    original_title: film?.originalTitle || '',
    film_type: film?.type || 'movie',
    release_year: film ? String(film.year) : '',
    duration_min: film?.duration ? String(film.duration) : '',
    age_limit: film?.ageLimit == null ? '' : String(film.ageLimit),
    description: film?.description || '',
  };
}

export function posterError(file: Pick<File, 'size' | 'type'>): string {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Выберите изображение JPEG или PNG.';
  if (!file.size || file.size > 5 * 1024 * 1024)
    return 'Размер постера должен быть от 1 байта до 5 МБ.';
  return '';
}

export interface AdminFilters {
  q: string;
  type: string;
  year: string;
  poster: string;
  sort: string;
}
export function filterAdminFilms(films: Film[], filters: AdminFilters): Film[] {
  const q = filters.q.trim().toLocaleLowerCase('ru');
  const result = films.filter(
    (film) =>
      (!q ||
        String(film.id) === q.replace(/^#/, '') ||
        `${film.title}\n${film.originalTitle}`.toLocaleLowerCase('ru').includes(q)) &&
      (!filters.type || film.type === filters.type) &&
      (!filters.year || String(film.year) === filters.year) &&
      (!filters.poster || Boolean(film.poster) === (filters.poster === 'yes')),
  );
  if (filters.sort === 'title')
    result.sort((a, b) => a.title.localeCompare(b.title, 'ru') || a.id - b.id);
  if (filters.sort === 'year') result.sort((a, b) => b.year - a.year || a.id - b.id);
  return result;
}
