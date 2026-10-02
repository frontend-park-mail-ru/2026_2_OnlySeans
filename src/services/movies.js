export const GENRES = [
  { id: 'comedy', label: 'Комедия' }, { id: 'drama', label: 'Драма' },
  { id: 'thriller', label: 'Триллер' }, { id: 'detective', label: 'Детектив' },
  { id: 'scifi', label: 'Фантастика' }, { id: 'fantasy', label: 'Фэнтези' },
  { id: 'adventure', label: 'Приключения' }, { id: 'action', label: 'Боевик' },
  { id: 'family', label: 'Семейный' }, { id: 'sport', label: 'Спорт' },
];

export const COUNTRIES = [
  { id: 'russia', label: 'Россия' }, { id: 'ussr', label: 'СССР' },
  { id: 'usa', label: 'США' }, { id: 'uk', label: 'Великобритания' },
  { id: 'france', label: 'Франция' }, { id: 'germany', label: 'Германия' },
  { id: 'canada', label: 'Канада' }, { id: 'hungary', label: 'Венгрия' },
  { id: 'australia', label: 'Австралия' },
];
export const MEDIA_TYPES = [{ id: 'movie', label: 'Фильм' }, { id: 'series', label: 'Сериал' }];

export const SEARCH_PLACEHOLDER = 'Поиск пока недоступен.';

export const getGenreLabel = (id) => GENRES.find((genre) => genre.id === id)?.label || id;

export const getFiltersFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const filters = {};
  for (const key of ['yearFrom', 'yearTo', 'ratingFrom', 'ratingTo']) {
    if (params.has(key) && params.get(key) !== '' && Number.isFinite(Number(params.get(key)))) filters[key] = Number(params.get(key));
  }
  for (const [name, options] of [['Genres', GENRES], ['Countries', COUNTRIES], ['Types', MEDIA_TYPES]]) {
    const known = new Set(options.map(({ id }) => id));
    for (const mode of ['include', 'exclude']) {
      const key = mode + name;
      filters[key] = [...new Set((params.get(key) || '').split(',').filter((id) => known.has(id)))];
    }
  }
  return filters;
};
export const getCategoryUrl = (category) => '/movies/' + category;

export const MOVIE_CATEGORIES = [
  { id: 'russian-films', country: 'russia', type: 'movie', eyebrow: '01 / Свои истории', title: 'Российские фильмы', description: 'Знакомые места. Большие чувства. Новые герои.' },
  { id: 'russian-series', country: 'russia', type: 'series', eyebrow: '02 / Ещё одну серию', title: 'Российские сериалы', description: 'Истории, с которыми хочется остаться подольше.' },
  { id: 'foreign-films', country: 'foreign', type: 'movie', eyebrow: '03 / За пределами привычного', title: 'Зарубежные фильмы', description: 'Большое кино со всего мира.' },
  { id: 'foreign-series', country: 'foreign', type: 'series', eyebrow: '04 / Продолжение следует', title: 'Зарубежные сериалы', description: 'Любимые герои и новые миры, серия за серией.' },
  { id: 'recommended', eyebrow: '05 / Ваш вкус', title: 'Для вас', description: 'Новые фильмы для вашего следующего вечера.' },
];
export const getCategoryConfig = (id) => MOVIE_CATEGORIES.find((category) => category.id === id)
  || ({ russian: { id, country: 'russia', title: 'Российские фильмы и сериалы', description: 'Все российские истории из нашего каталога.' }, foreign: { id, country: 'foreign', title: 'Зарубежные фильмы и сериалы', description: 'Истории со всего мира.' } })[id];
export const selectCategoryMovies = (movies, category) => category.id === 'recommended'
  ? movies
  : movies.filter((movie) => (!category.country || movie.country === category.country) && (!category.type || movie.type === category.type));

export const shuffleMovies = (movies) => {
  const shuffled = [...movies];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

