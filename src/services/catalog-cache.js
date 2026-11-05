import { getMovies } from '../api/movies.js';

// Новые блоки фич читают каталог несколько раз за одну страницу: делим один запрос на 60 секунд.
const TTL = 60000;
let cached = null;

export const getCatalog = () => {
  if (cached && Date.now() - cached.at < TTL) return cached.promise;
  const promise = getMovies().catch((error) => {
    if (cached?.promise === promise) cached = null;
    throw error;
  });
  cached = { at: Date.now(), promise };
  return promise;
};
