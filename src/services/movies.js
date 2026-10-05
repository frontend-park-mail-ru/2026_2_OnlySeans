const GENRES = [
  { id: 'comedy', label: 'Комедия' }, { id: 'drama', label: 'Драма' },
  { id: 'thriller', label: 'Триллер' }, { id: 'detective', label: 'Детектив' },
  { id: 'scifi', label: 'Фантастика' }, { id: 'fantasy', label: 'Фэнтези' },
  { id: 'adventure', label: 'Приключения' }, { id: 'action', label: 'Боевик' },
  { id: 'family', label: 'Семейный' }, { id: 'sport', label: 'Спорт' },
];

export const getGenreLabel = (id) => GENRES.find((genre) => genre.id === id)?.label || id;
