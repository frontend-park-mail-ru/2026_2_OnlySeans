const GENRES = [
  { id: 'comedy', label: 'Комедия' }, { id: 'drama', label: 'Драма' },
  { id: 'thriller', label: 'Триллер' }, { id: 'detective', label: 'Детектив' },
  { id: 'scifi', label: 'Фантастика' }, { id: 'fantasy', label: 'Фэнтези' },
  { id: 'adventure', label: 'Приключения' }, { id: 'action', label: 'Боевик' },
  { id: 'family', label: 'Семейный' }, { id: 'sport', label: 'Спорт' },
];

export const getGenreLabel = (id) => GENRES.find((genre) => genre.id === id)?.label || id;

export const plural = (count, forms) => {
  const last = count % 10;
  const lastTwo = count % 100;
  const index = lastTwo >= 11 && lastTwo <= 14 ? 2 : last === 1 ? 0 : last >= 2 && last <= 4 ? 1 : 2;

  return `${count} ${forms[index]}`;
};

export const countLabel = (movies) => plural(movies.length, ['фильм', 'фильма', 'фильмов']);

export const collectGenres = (movies) => [...new Set(movies.flatMap((movie) => movie.genres))].sort();

export const collectYears = (movies) => [...new Set(movies.map((movie) => movie.year))].sort((a, b) => b - a);

export const filterMovies = (movies, { type, genre, year, query } = {}) => {
  const text = (query || '').trim().toLowerCase();

  return movies.filter((movie) => {
    if (type && movie.type !== type) return false;
    if (genre && !movie.genres.includes(genre)) return false;
    if (year && movie.year !== Number(year)) return false;
    if (text && !`${movie.title} ${movie.englishTitle}`.toLowerCase().includes(text)) return false;

    return true;
  });
};

export const findSimilar = (movie, movies, limit = 7) => {
  return movies
    .filter((other) => other.id !== movie.id && other.genres.some((genre) => movie.genres.includes(genre)))
    .slice(0, limit);
};
