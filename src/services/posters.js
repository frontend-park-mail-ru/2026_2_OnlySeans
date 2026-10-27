const seedPosters = {
  'shawshank-redemption': 'shawshank', 'green-mile': 'green-mile',
  'forrest-gump': 'forrest-gump', interstellar: 'interstellar', inception: 'inception',
  'shutter-island': 'shutter-island', 'lion-king': 'lion-king', 'home-alone': 'home-alone',
  'ivan-vasilievich': 'ivan-vasilievich', 'the-gentlemen': 'gentlemen', sherlock: 'sherlock', 'breaking-bad': 'breaking-bad',
};

export const getMoviePoster = movie => {
  const match = movie.poster?.match(/\/static\/posters\/([a-z-]+)\.svg$/);
  const local = match && seedPosters[match[1]];
  return local ? new URL(`../media/auth/posters/${local}.jpg`, import.meta.url).href : movie.poster;
};
