const hasGenre = (film, pattern) => film.genres.some((genre) => pattern.test(genre));

const RUBRICS = [
  { label: 'Фильм недели', fits: () => true },
  { label: 'Фильм дня', fits: (film) => !film.isSeries },
  { label: 'Сейчас в тренде', fits: (film) => film.year >= 2019 },
  { label: 'Выбор редакции', fits: (film) => hasGenre(film, /драма/i) },
  { label: 'Классика кино', fits: (film) => film.year < 2000 },
  { label: 'Для уютного вечера', fits: (film) => hasGenre(film, /семейн|комедия/i) },
  { label: 'Держит в напряжении', fits: (film) => hasGenre(film, /триллер|криминал/i) },
  { label: 'Сериал на выходные', fits: (film) => film.isSeries },
];

export function buildSlides(films) {
  const used = new Set();
  return RUBRICS.map(({ label, fits }) => {
    const film =
      films.find((item) => !used.has(item.id) && fits(item)) ||
      films.find((item) => !used.has(item.id)) ||
      films[0];
    used.add(film.id);
    return { label, film };
  });
}
